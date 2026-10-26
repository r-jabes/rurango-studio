"use client";

import { useMemo, useState, type ReactNode } from "react";

type PaginatedPanelProps<T> = {
  items: T[];
  pageSize?: number;
  maxHeightClassName?: string;
  emptyLabel?: string;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  listClassName?: string;
  /** Timeline-style left border (activity). */
  variant?: "list" | "timeline";
};

export function PaginatedPanel<T>({
  items,
  pageSize = 8,
  maxHeightClassName = "max-h-80",
  emptyLabel = "Nothing to show yet.",
  getKey,
  renderItem,
  listClassName,
  variant = "list",
}: PaginatedPanelProps<T>) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);

  const slice = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, pageSize, safePage]);

  if (total === 0) {
    return <p className="text-sm text-foreground-muted">{emptyLabel}</p>;
  }

  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  const resolvedListClass =
    listClassName ??
    (variant === "timeline"
      ? "space-y-4 border-l border-border pl-4"
      : "space-y-4");

  return (
    <div className="space-y-3">
      <div className={`${maxHeightClassName} overflow-y-auto pr-1`}>
        <ol className={resolvedListClass}>
          {slice.map((item) => (
            <li key={getKey(item)} className="relative">
              {variant === "timeline" ? (
                <span
                  aria-hidden="true"
                  className="absolute -left-[1.2rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent"
                />
              ) : null}
              {renderItem(item)}
            </li>
          ))}
        </ol>
      </div>

      {pages > 1 ? (
        <nav
          aria-label="Pagination"
          className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm text-foreground-secondary"
        >
          <p className="text-xs text-foreground-muted">
            Showing {from}–{to} of {total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:text-foreground-muted disabled:no-underline"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, Math.min(p, pages) - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:text-foreground-muted disabled:no-underline"
              disabled={safePage >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
            >
              Next
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
