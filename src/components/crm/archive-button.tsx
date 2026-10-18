"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useActionFeedback } from "@/lib/use-action-feedback";
import type { ActionResult } from "@/lib/action-result";
import {
  archiveClientAction,
  restoreClientAction,
  archiveProjectAction,
} from "@/server/crm/actions";
import {
  archiveDocumentAction,
  restoreDocumentAction,
} from "@/server/documents/actions";

export type ArchiveEntity = "client" | "project" | "document";
export type ArchiveMode = "archive" | "restore";

type ArchiveButtonProps = {
  entity: ArchiveEntity;
  entityId: string;
  mode: ArchiveMode;
  label: string;
  confirmTitle: string;
  confirmDescription: string;
};

async function runArchiveAction(
  entity: ArchiveEntity,
  mode: ArchiveMode,
  entityId: string,
): Promise<ActionResult> {
  switch (entity) {
    case "client":
      return mode === "archive"
        ? archiveClientAction(entityId)
        : restoreClientAction(entityId);
    case "project":
      if (mode === "restore") {
        return {
          ok: false,
          message: "Project restore is not available from this action.",
        };
      }
      return archiveProjectAction(entityId);
    case "document":
      return mode === "archive"
        ? archiveDocumentAction(entityId)
        : restoreDocumentAction(entityId);
  }
}

/**
 * Client-side archive/restore control.
 * Calls server actions directly so RSC pages never pass non-serializable
 * function closures across the server→client boundary.
 */
export function ArchiveButton({
  entity,
  entityId,
  mode,
  label,
  confirmTitle,
  confirmDescription,
}: ArchiveButtonProps) {
  const { pending, run } = useActionFeedback();
  const [open, setOpen] = useState(false);

  function onConfirm() {
    run(() => runArchiveAction(entity, mode, entityId), {
      successTitle: mode === "archive" ? "Archived" : "Restored",
      onSuccess: () => setOpen(false),
    });
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={label}
        busy={pending}
        onCancel={() => setOpen(false)}
        onConfirm={onConfirm}
      />
    </>
  );
}
