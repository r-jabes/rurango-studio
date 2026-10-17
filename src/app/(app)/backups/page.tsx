import { BackupTriggerForm } from "@/components/settings/backup-trigger-form";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";
import { requireRole } from "@/lib/session";
import { listBackupRuns } from "@/server/settings/queries";

export const metadata = { title: "Backups" };

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" {
  if (status === "succeeded") return "success";
  if (status === "running") return "warning";
  if (status === "failed") return "danger";
  return "neutral";
}

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
        {runs.length === 0 ? (
          <p className="text-sm text-foreground-muted">No backup runs yet.</p>
        ) : (
          <ul className="space-y-3">
            {runs.map((run) => (
              <li
                key={run.id}
                className="rounded-xl border border-border bg-surface/40 p-4 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={statusTone(run.status)}>{run.status}</Badge>
                  <Badge tone="neutral">{run.kind}</Badge>
                  <span className="text-foreground-secondary">
                    {run.startedAt.toLocaleString()}
                  </span>
                </div>
                {run.destinationRef ? (
                  <p className="mt-2 font-mono text-xs text-foreground-muted">
                    {run.destinationRef}
                    {run.byteSize != null ? ` · ${run.byteSize} bytes` : ""}
                  </p>
                ) : null}
                {run.errorMessage ? (
                  <p className="mt-2 text-red-200">{run.errorMessage}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
