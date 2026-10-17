"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setCurrentVersionAction } from "@/server/documents/actions";

type SetCurrentVersionButtonProps = {
  documentId: string;
  versionId: string;
};

export function SetCurrentVersionButton({
  documentId,
  versionId,
}: SetCurrentVersionButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await setCurrentVersionAction(documentId, versionId);
          router.refresh();
        });
      }}
    >
      {pending ? "Updating…" : "Make current"}
    </Button>
  );
}
