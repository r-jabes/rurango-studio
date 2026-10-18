"use client";

import { Select } from "@/components/ui/select";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { updateTaskStatusAction } from "@/server/crm/actions";

type TaskStatusSelectProps = {
  taskId: string;
  value: string;
};

export function TaskStatusSelect({ taskId, value }: TaskStatusSelectProps) {
  const { pending, run } = useActionFeedback();

  return (
    <Select
      aria-label="Task status"
      value={value}
      disabled={pending}
      onChange={(event) => {
        const next = event.target.value;
        run(() => updateTaskStatusAction(taskId, next), {
          successTitle: "Task updated",
        });
      }}
    >
      <option value="todo">To do</option>
      <option value="in_progress">In progress</option>
      <option value="blocked">Blocked</option>
      <option value="done">Done</option>
      <option value="cancelled">Cancelled</option>
    </Select>
  );
}
