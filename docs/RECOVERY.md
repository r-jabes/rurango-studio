# Rurango Studio — Recovery runbook (Phase 7)

This document describes how to recover Studio data using provider capabilities plus Studio logical backup artifacts.

## What Studio backups are

Studio backup runs write a JSON artifact to object storage under `backups/YYYY-MM-DD/<runId>-<kind>.json`.

| Kind | Contents |
|---|---|
| `db` | Logical JSON snapshot of core tables (clients, projects, commercial docs, payments, CMS, document metadata, settings) |
| `files` | Inventory of vault files (paths + sizes). Not a full binary dump of every object when using remote S3. |
| `full` | Both of the above |

These artifacts are for **recovery drills and reconstruction**. They are not a substitute for:

- Managed Postgres point-in-time recovery (Neon / RDS / etc.)
- Object-storage versioning and lifecycle policies on the vault bucket

## Production expectations

1. Enable PITR / continuous backups on the Postgres provider.
2. Prefer a separate backup destination (`BACKUP_S3_BUCKET`) from the live vault bucket.
3. Set `BACKUP_CRON_SECRET` and schedule:

```http
POST /api/backups/run
x-backup-cron-secret: <BACKUP_CRON_SECRET>
Content-Type: application/json

{ "kind": "full" }
```

4. Keep `BACKUP_RETENTION_DAYS` aligned with your storage lifecycle rules.

## Restore drill (quarterly)

### A. Database (preferred)

1. Create a new staging database from a PITR snapshot at the incident timestamp.
2. Point a staging Studio deploy at that `DATABASE_URL`.
3. Run migrations if needed (`npm run db:migrate`).
4. Sign in as owner and verify CRM, commercial docs, CMS, and payments counts.

### B. Logical JSON reconstruction (fallback)

1. Download the latest successful `full` or `db` artifact from storage.
2. Inspect `tables.*` in the JSON.
3. Manually re-import critical rows into a fresh database **only after** verifying no more recent PITR snapshot exists.
4. Re-seed the owner account if auth rows were not restored (`npm run db:seed` in development only).

### C. Files

1. Confirm vault objects still exist in the primary (or backup) bucket.
2. If objects were deleted, restore from bucket versioning / backup bucket copies.
3. Use the file inventory in the backup JSON to confirm expected keys and sizes.

## Pass criteria for a drill

- [ ] Staging Studio boots against restored DB
- [ ] Owner can sign in (MFA if enabled)
- [ ] Spot-check: one client, one project, one invoice, one vault document, one CMS entry
- [ ] Backup cron endpoint returns 200 with a new `backup_runs` row
- [ ] Incident notes recorded (time, operator, gaps found)

## Security notes

- Backup artifacts may contain private business data. Treat them as confidential.
- Do not expose `/api/backups/run` without the cron secret.
- MFA secrets live in `two_factor`; restore carefully and rotate if compromise is suspected.
