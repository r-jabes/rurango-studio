"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui/select";
import { updateTaskStatusAction } from "@/server/crm/actions";

type TaskStatusSelectProps = {
  taskId: string;
  value: string;
};

export function TaskStatusSelect({ taskId, value }: TaskStatusSelectProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Select
      aria-label="Task status"
      value={value}
      disabled={pending}
      onChange={(event) => {
        const next = event.target.value;
        startTransition(async () => {
          await updateTaskStatusAction(taskId, next);
          router.refresh();
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
