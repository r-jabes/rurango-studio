"use client";

import { PaginatedPanel } from "@/components/ui/paginated-panel";

type ActivityItem = {
  id: string;
  type: string;
  summary: string;
  createdAt: Date | string;
};

type ActivityTimelineProps = {
  items: ActivityItem[];
  emptyLabel?: string;
  pageSize?: number;
};

export function ActivityTimeline({
  items,
  emptyLabel = "No activity yet.",
  pageSize = 8,
}: ActivityTimelineProps) {
  return (
    <PaginatedPanel
      items={items}
      pageSize={pageSize}
      maxHeightClassName="max-h-80"
      emptyLabel={emptyLabel}
      variant="timeline"
      getKey={(item) => item.id}
      renderItem={(item) => {
        const when =
          item.createdAt instanceof Date
            ? item.createdAt
            : new Date(item.createdAt);
        return (
          <>
            <p className="text-sm text-foreground">{item.summary}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-foreground-muted">
              {item.type} ·{" "}
              {when.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </>
        );
      }}
    />
  );
}
