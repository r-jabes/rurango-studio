"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ActionResult } from "@/lib/action-result";

type ArchiveButtonProps = {
  label: string;
  confirmTitle: string;
  confirmDescription: string;
  action: () => Promise<ActionResult>;
};

export function ArchiveButton({
  label,
  confirmTitle,
  confirmDescription,
  action,
}: ArchiveButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
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
