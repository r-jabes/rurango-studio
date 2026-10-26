"use client";

import { PaginatedPanel } from "@/components/ui/paginated-panel";

type HandoverItem = {
  id: string;
  acceptedByName?: string | null;
  acceptedAt?: string | null;
  notes?: string | null;
  hasFile: boolean;
};

export function HandoverList({ items }: { items: HandoverItem[] }) {
  return (
    <PaginatedPanel
      items={items}
      pageSize={8}
      maxHeightClassName="max-h-72"
      emptyLabel="No handover records yet."
      listClassName="space-y-3"
      getKey={(h) => h.id}
      renderItem={(handover) => (
        <div className="border-t border-border pt-3 text-sm">
          <p className="font-medium">
            {handover.acceptedByName
              ? `Accepted by ${handover.acceptedByName}`
              : "Handover note"}
          </p>
          {handover.acceptedAt ? (
            <p className="text-xs text-foreground-muted">
              {new Date(handover.acceptedAt).toLocaleString()}
            </p>
          ) : null}
          {handover.notes ? (
            <p className="mt-1 whitespace-pre-wrap text-foreground-secondary">
              {handover.notes}
            </p>
          ) : null}
          {handover.hasFile ? (
            <a
              href={`/api/handover/${handover.id}/file`}
              className="mt-1 inline-block text-accent underline-offset-2 hover:underline"
            >
              Download artifact
            </a>
          ) : null}
        </div>
      )}
    />
  );
}
