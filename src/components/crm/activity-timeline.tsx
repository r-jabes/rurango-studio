type ActivityItem = {
  id: string;
  type: string;
  summary: string;
  createdAt: Date | string;
};

type ActivityTimelineProps = {
  items: ActivityItem[];
  emptyLabel?: string;
};

export function ActivityTimeline({
  items,
  emptyLabel = "No activity yet.",
}: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">{emptyLabel}</p>
    );
  }

  return (
    <ol className="space-y-4 border-l border-border pl-4">
      {items.map((item) => {
        const when =
          item.createdAt instanceof Date
            ? item.createdAt
            : new Date(item.createdAt);
        return (
          <li key={item.id} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[1.2rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent"
            />
            <p className="text-sm text-foreground">{item.summary}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-foreground-muted">
              {item.type} ·{" "}
              {when.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
