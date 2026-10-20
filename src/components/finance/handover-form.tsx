"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { recordHandoverAction } from "@/server/finance/actions";

export function HandoverForm({ projectId }: { projectId: string }) {
  const { pending, run } = useActionFeedback();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("projectId", projectId);

    run(() => recordHandoverAction(formData), {
      successTitle: "Handover recorded",
      onSuccess: () => form.reset(),
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="acceptedByName">Accepted by</Label>
          <Input id="acceptedByName" name="acceptedByName" />
        </div>
        <div>
          <Label htmlFor="acceptedAt">Accepted at</Label>
          <Input id="acceptedAt" name="acceptedAt" type="datetime-local" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="file">Optional artifact</Label>
          <Input id="file" name="file" type="file" />
          <p className="mt-1 text-xs text-foreground-muted">
            Optional attachment stored with the handover record.
          </p>
        </div>
      </div>
      <Button type="submit" size="sm" loading={pending}>
        {pending ? "Saving…" : "Record handover"}
      </Button>
    </form>
  );
}
