"use client";

import { Button } from "@/components/ui/button";
import type { CmsEntryStatus } from "@/lib/cms/meta";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { setCmsStatusAction } from "@/server/cms/actions";

const transitions: Array<{ status: CmsEntryStatus; label: string }> = [
  { status: "draft", label: "Set draft" },
  { status: "in_review", label: "Submit for review" },
  { status: "published", label: "Publish" },
  { status: "archived", label: "Archive" },
];

export function CmsStatusActions({
  entryId,
  currentStatus,
  type,
}: {
  entryId: string;
  currentStatus: CmsEntryStatus;
  type: string;
}) {
  const { pending, run } = useActionFeedback();

  return (
    <div className="space-y-3 rounded-md border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-secondary">
        Workflow
      </h2>
      <div className="flex flex-wrap gap-2">
        {transitions
          .filter((item) => item.status !== currentStatus)
          .map((item) => (
            <Button
              key={item.status}
              size="sm"
              variant={item.status === "published" ? "primary" : "secondary"}
              loading={pending}
              onClick={() => {
                const fd = new FormData();
                fd.set("status", item.status);
                run(() => setCmsStatusAction(entryId, fd), {
                  successTitle: "Status updated",
                });
              }}
            >
              {item.label}
            </Button>
          ))}
      </div>
      {type === "portfolio_project" ? (
        <p className="text-xs text-foreground-secondary">
          Publishing makes this entry available on Studio’s read-only content
          API. The public site picks it up via{" "}
          <code className="font-mono text-accent">npm run content:pull</code>{" "}
          in <code className="font-mono">web/</code>. Static projects still win
          on slug conflicts.
        </p>
      ) : null}
    </div>
  );
}
