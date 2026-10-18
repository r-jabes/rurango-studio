"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { createDeploymentAction } from "@/server/finance/actions";

export function DeploymentForm({ projectId }: { projectId: string }) {
  const { pending, fieldErrors, run } = useActionFeedback();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("projectId", projectId);

    run(() => createDeploymentAction(formData), {
      successTitle: "Deployment recorded",
      onSuccess: () => form.reset(),
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="environment">Environment</Label>
          <Input
            id="environment"
            name="environment"
            placeholder="production, staging…"
          />
        </div>
        <div>
          <Label htmlFor="deployedAt">Deployed at</Label>
          <Input id="deployedAt" name="deployedAt" type="datetime-local" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="url">URL</Label>
          <Input id="url" name="url" placeholder="https://" />
          <FieldError errors={fieldErrors.url} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
      </div>
      <Button type="submit" size="sm" loading={pending}>
        {pending ? "Saving…" : "Add deployment"}
      </Button>
    </form>
  );
}
