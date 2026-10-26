import { BackupRunsList } from "@/components/settings/backup-runs-list";
import { BackupTriggerForm } from "@/components/settings/backup-trigger-form";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";
import { requireRole } from "@/lib/session";
import { listBackupRuns } from "@/server/settings/queries";

export const metadata = { title: "Backups" };

export default async function BackupsPage() {
  await requireRole(["owner"]);

  let runs: Awaited<ReturnType<typeof listBackupRuns>> = [];
  let loadError: string | null = null;
  try {
    runs = await listBackupRuns();
  } catch {
    loadError =
      "Could not load backup runs. Confirm migration 0006 has been applied.";
  }

  const retentionDays = process.env.BACKUP_RETENTION_DAYS ?? "30";
  const cronConfigured = Boolean(process.env.BACKUP_CRON_SECRET);
  const independentBucket = Boolean(process.env.BACKUP_S3_BUCKET);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backups"
        description="Owner-only backup runs for Studio recovery drills. Prefer provider database PITR for production restore."
      />

      {loadError ? <StatusBanner tone="warning">{loadError}</StatusBanner> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface/50 p-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-foreground-muted">
            Cron secret
          </p>
          <p className="mt-1 font-medium">
            {cronConfigured ? "Configured" : "Not set"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-foreground-muted">
            Independent backup bucket
          </p>
          <p className="mt-1 font-medium">
            {independentBucket ? "Configured" : "Using primary storage"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-foreground-muted">
            Retention target
          </p>
          <p className="mt-1 font-medium">{retentionDays} days</p>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-surface/40 p-5">
        <h2 className="mb-4 text-sm font-medium">Run backup</h2>
        <BackupTriggerForm />
      </section>

      <StatusBanner tone="info">
        Scheduled triggers:{" "}
        <code className="font-mono text-accent">
          POST /api/backups/run
        </code>{" "}
        with header{" "}
        <code className="font-mono">x-backup-cron-secret: $BACKUP_CRON_SECRET</code>
        . See <code className="font-mono">docs/RECOVERY.md</code> for restore
        drill steps.
      </StatusBanner>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Recent runs</h2>
        <BackupRunsList
          runs={runs.map((run) => ({
            id: run.id,
            status: run.status,
            kind: run.kind,
            startedAt: run.startedAt.toISOString(),
            destinationRef: run.destinationRef,
            byteSize: run.byteSize,
            errorMessage: run.errorMessage,
          }))}
        />
      </section>
    </div>
  );
}
