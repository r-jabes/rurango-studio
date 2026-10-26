"use client";

import { PaginatedPanel } from "@/components/ui/paginated-panel";

type DeploymentItem = {
  id: string;
  environment?: string | null;
  url?: string | null;
  notes?: string | null;
  deployedAt: string;
  creatorName?: string | null;
};

export function DeploymentList({ items }: { items: DeploymentItem[] }) {
  return (
    <PaginatedPanel
      items={items}
      pageSize={8}
      maxHeightClassName="max-h-72"
      emptyLabel="No deployments yet."
      listClassName="space-y-3"
      getKey={(d) => d.id}
      renderItem={(deployment) => (
        <div className="border-t border-border pt-3 text-sm">
          <p className="font-medium">
            {deployment.environment ?? "Deployment"}
          </p>
          {deployment.url ? (
            <a
              href={deployment.url}
              target="_blank"
              rel="noreferrer"
              className="break-all text-accent underline-offset-2 hover:underline"
            >
              {deployment.url}
            </a>
          ) : null}
          <p className="mt-1 text-xs text-foreground-muted">
            {new Date(deployment.deployedAt).toLocaleString()} ·{" "}
            {deployment.creatorName ?? "Unknown"}
          </p>
          {deployment.notes ? (
            <p className="mt-1 text-foreground-secondary">{deployment.notes}</p>
          ) : null}
        </div>
      )}
    />
  );
}
