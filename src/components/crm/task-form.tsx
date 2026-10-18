"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { createTaskAction } from "@/server/crm/actions";

type MilestoneOption = { id: string; title: string };

type TaskFormProps = {
  projectId: string;
  milestones: MilestoneOption[];
};

export function TaskForm({ projectId, milestones }: TaskFormProps) {
  const { pending, fieldErrors, run } = useActionFeedback();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("projectId", projectId);

    run(() => createTaskAction(formData), {
      successTitle: "Task added",
      onSuccess: () => form.reset(),
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="title">Task title</Label>
        <Input id="title" name="title" required />
        <FieldError errors={fieldErrors.title} />
      </div>
      <div>
        <Label htmlFor="milestoneId">Milestone</Label>
        <Select id="milestoneId" name="milestoneId" defaultValue="">
          <option value="">None</option>
          {milestones.map((milestone) => (
            <option key={milestone.id} value={milestone.id}>
              {milestone.title}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select id="priority" name="priority" defaultValue="medium">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue="todo">
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="dueOn">Due on</Label>
        <Input id="dueOn" name="dueOn" type="date" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" loading={pending}>
          {pending ? "Adding…" : "Add task"}
        </Button>
      </div>
    </form>
  );
}
