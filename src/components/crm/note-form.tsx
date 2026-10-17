"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/label";
import { StatusBanner } from "@/components/ui/status-banner";
import { Textarea } from "@/components/ui/textarea";
import type { FieldErrors } from "@/lib/action-result";
import { createNoteAction } from "@/server/crm/actions";

type NoteFormProps = {
  clientId?: string;
  projectId?: string;
};

export function NoteForm({ clientId, projectId }: NoteFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (clientId) formData.set("clientId", clientId);
    if (projectId) formData.set("projectId", projectId);
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createNoteAction(formData);
      if (!result.ok) {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}
      <div>
        <Label htmlFor="body">Add note</Label>
        <Textarea id="body" name="body" required />
        <FieldError errors={fieldErrors.body} />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Add note"}
      </Button>
    </form>
  );
}
