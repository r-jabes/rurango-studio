"use client";

import { PaginatedPanel } from "@/components/ui/paginated-panel";

type AuditRow = {
  id: string;
  action: string;
  createdAt: Date | string;
  entityType?: string | null;
  entityId?: string | null;
};

export function AuditLogList({ rows }: { rows: AuditRow[] }) {
  return (
    <PaginatedPanel
      items={rows}
      pageSize={10}
      maxHeightClassName="max-h-96"
      emptyLabel="No audit events yet."
      listClassName="space-y-2 text-sm"
      getKey={(row) => row.id}
      renderItem={(row) => {
        const when =
          row.createdAt instanceof Date
            ? row.createdAt
            : new Date(row.createdAt);
        return (
          <div className="border-t border-border pt-2 first:border-0 first:pt-0">
            <p className="font-medium">{row.action}</p>
            <p className="text-xs text-foreground-muted">
              {when.toLocaleString()}
              {row.entityType ? ` · ${row.entityType}` : ""}
              {row.entityId ? ` · ${row.entityId}` : ""}
            </p>
          </div>
        );
      }}
    />
  );
}
