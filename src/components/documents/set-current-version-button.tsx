"use client";

import { Button } from "@/components/ui/button";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { setCurrentVersionAction } from "@/server/documents/actions";

type SetCurrentVersionButtonProps = {
  documentId: string;
  versionId: string;
};

export function SetCurrentVersionButton({
  documentId,
  versionId,
}: SetCurrentVersionButtonProps) {
  const { pending, run } = useActionFeedback();

  return (
    <Button
      size="sm"
      variant="secondary"
      loading={pending}
      onClick={() =>
        run(() => setCurrentVersionAction(documentId, versionId), {
          successTitle: "Current version updated",
        })
      }
    >
      {pending ? "Updating…" : "Make current"}
    </Button>
  );
}
