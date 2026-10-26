"use client";

import { PaginatedPanel } from "@/components/ui/paginated-panel";

type NoteItem = {
  id: string;
  body: string;
  createdAt: Date | string;
  authorName?: string | null;
};

type NotesListProps = {
  notes: NoteItem[];
  emptyLabel?: string;
};

export function NotesList({
  notes,
  emptyLabel = "No notes yet.",
}: NotesListProps) {
  return (
    <PaginatedPanel
      items={notes}
      pageSize={8}
      maxHeightClassName="max-h-80"
      emptyLabel={emptyLabel}
      listClassName="space-y-4"
      getKey={(note) => note.id}
      renderItem={(note) => {
        const when =
          note.createdAt instanceof Date
            ? note.createdAt
            : new Date(note.createdAt);
        return (
          <div className="border-t border-border pt-4 text-sm first:border-0 first:pt-0">
            <p className="whitespace-pre-wrap text-foreground">{note.body}</p>
            <p className="mt-2 text-xs text-foreground-muted">
              {note.authorName ?? "Unknown"} · {when.toLocaleString()}
            </p>
          </div>
        );
      }}
    />
  );
}
