"use client";

import type { ReactNode } from "react";
import { PaginatedPanel } from "@/components/ui/paginated-panel";

type RecordListProps<T> = {
  items: T[];
  emptyLabel?: string;
  pageSize?: number;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
};

/** Paginated fixed-height list for detail-page side panels. */
export function RecordList<T>({
  items,
  emptyLabel = "Nothing yet.",
  pageSize = 8,
  getKey,
  renderItem,
}: RecordListProps<T>) {
  return (
    <PaginatedPanel
      items={items}
      pageSize={pageSize}
      maxHeightClassName="max-h-72"
      emptyLabel={emptyLabel}
      listClassName="space-y-3"
      getKey={getKey}
      renderItem={renderItem}
    />
  );
}
