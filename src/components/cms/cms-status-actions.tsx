"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import type { CmsEntryStatus } from "@/lib/cms/meta";
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3 rounded-md border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-secondary">
        Workflow
      </h2>
      {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}
      <div className="flex flex-wrap gap-2">
        {transitions
          .filter((item) => item.status !== currentStatus)
          .map((item) => (
            <Button
              key={item.status}
              size="sm"
              variant={item.status === "published" ? "primary" : "secondary"}
              disabled={pending}
              onClick={() => {
                setError(null);
                setMessage(null);
                const fd = new FormData();
                fd.set("status", item.status);
                startTransition(async () => {
                  const result = await setCmsStatusAction(entryId, fd);
                  if (!result.ok) {
                    setError(result.message);
                    return;
                  }
                  setMessage(result.message ?? "Updated.");
                  router.refresh();
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
