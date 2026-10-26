"use client";

import { Badge } from "@/components/ui/badge";
import { PaginatedPanel } from "@/components/ui/paginated-panel";

type BackupRun = {
  id: string;
  status: string;
  kind: string;
  startedAt: Date | string;
  destinationRef?: string | null;
  byteSize?: number | null;
  errorMessage?: string | null;
};

function statusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "succeeded":
      return "success";
    case "running":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

export function BackupRunsList({ runs }: { runs: BackupRun[] }) {
  return (
    <PaginatedPanel
      items={runs}
      pageSize={10}
      maxHeightClassName="max-h-96"
      emptyLabel="No backup runs yet."
      listClassName="space-y-3"
      getKey={(run) => run.id}
      renderItem={(run) => {
        const when =
          run.startedAt instanceof Date
            ? run.startedAt
            : new Date(run.startedAt);
        return (
          <div className="rounded-xl border border-border bg-surface/40 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(run.status)}>{run.status}</Badge>
              <Badge tone="neutral">{run.kind}</Badge>
              <span className="text-foreground-secondary">
                {when.toLocaleString()}
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
          </div>
        );
      }}
    />
  );
}
