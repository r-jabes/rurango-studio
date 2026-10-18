"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { createNoteAction } from "@/server/crm/actions";

type NoteFormProps = {
  clientId?: string;
  projectId?: string;
};

export function NoteForm({ clientId, projectId }: NoteFormProps) {
  const { pending, fieldErrors, run } = useActionFeedback();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (clientId) formData.set("clientId", clientId);
    if (projectId) formData.set("projectId", projectId);

    run(() => createNoteAction(formData), {
      successTitle: "Note added",
      onSuccess: () => form.reset(),
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label htmlFor="body">Add note</Label>
        <Textarea id="body" name="body" required />
        <FieldError errors={fieldErrors.body} />
      </div>
      <Button type="submit" size="sm" loading={pending}>
        {pending ? "Saving…" : "Add note"}
      </Button>
    </form>
  );
}
