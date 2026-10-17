# Rurango Studio — Release runbook (Phase 8)

Operational checklist for deploying and verifying Studio at `studio.rurango.com`.

## Preconditions

- Separate Vercel (or host) project with root directory `studio/`
- Postgres with migrations applied through the current drizzle folder
- Private object storage configured (`STORAGE_DRIVER=s3` in production)
- Secrets set from `.env.example` (never commit real values)
- Portfolio (`web/`) remains a separate project; CMS pull uses `CMS_CONTENT_TOKEN` only

## Required environment

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_STUDIO_URL` | Canonical origin, no trailing slash |
| `APP_ENV` | `production` on live |
| `DATABASE_URL` | Postgres connection string |
| `BETTER_AUTH_SECRET` | 32+ random chars |
| `STORAGE_DRIVER` / `S3_*` | Private vault bucket |
| `CMS_CONTENT_TOKEN` | 16+ chars; shared with portfolio pull job |
| `BACKUP_CRON_SECRET` | Protects `POST /api/backups/run` |
| `BACKUP_S3_BUCKET` | Prefer a bucket separate from the live vault |

Optional: `BACKUP_RETENTION_DAYS`, MFA via Settings after first owner login.

## Pre-release verification (local or CI)

From `studio/`:

```bash
npm run typecheck
npm run lint
npm test
# BETTER_AUTH_SECRET (and DATABASE_URL) must be set for `next build`
npm run build
```

Optional smoke (app already running on 3001):

```bash
STUDIO_E2E_BASE_URL=http://localhost:3001 npm run test:e2e
```

All four primary commands must exit 0 before promoting a build.

## Deploy sequence

1. Merge approved Studio changes.
2. Ensure host env matches production secrets.
3. Run migrations against production Postgres: `npm run db:migrate`.
4. Deploy the Studio app (root `studio/`).
5. Confirm DNS for `studio.rurango.com` points at the Studio project only.
6. Sign in as owner; enable MFA if not already enabled.
7. Trigger a backup drill: `POST /api/backups/run` with `x-backup-cron-secret`.
8. Confirm portfolio pull still works (`web` `content:pull` + Bearer token).

Do **not** run `db:seed` in production. Bootstrap the first owner through a controlled one-time process only.

## Post-deploy smoke

- [ ] `https://studio.rurango.com/login` loads
- [ ] Unauthenticated `/clients` redirects to login
- [ ] Owner login succeeds (MFA challenge if enabled)
- [ ] Spot-check: client, project, invoice PDF, vault download, CMS publish list
- [ ] `GET /api/public/content/projects` with Bearer token returns 200
- [ ] Same request without token returns 401
- [ ] Backup cron returns 200 and inserts a `backup_runs` row

## Rollback

1. Redeploy the previous Studio deployment artifact.
2. If a migration is unsafe to reverse, restore Postgres via provider PITR to the pre-deploy timestamp (see `docs/RECOVERY.md`).
3. Do not point Studio at the portfolio database or bucket.

## Related docs

- `docs/RECOVERY.md` — backup artifacts and restore drills
- `../docs/09-RURANGO-STUDIO-IMPLEMENTATION-PLAN.md` — architecture and phase map
- `.env.example` — full variable list
