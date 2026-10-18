"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { createMilestoneAction } from "@/server/crm/actions";

type MilestoneFormProps = {
  projectId: string;
};

export function MilestoneForm({ projectId }: MilestoneFormProps) {
  const { pending, fieldErrors, run } = useActionFeedback();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("projectId", projectId);

    run(() => createMilestoneAction(formData), {
      successTitle: "Milestone added",
      onSuccess: () => form.reset(),
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="title">Milestone title</Label>
        <Input id="title" name="title" required />
        <FieldError errors={fieldErrors.title} />
      </div>
      <div>
        <Label htmlFor="dueOn">Due on</Label>
        <Input id="dueOn" name="dueOn" type="date" />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue="planned">
          <option value="planned">Planned</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" loading={pending}>
          {pending ? "Adding…" : "Add milestone"}
        </Button>
      </div>
    </form>
  );
}
