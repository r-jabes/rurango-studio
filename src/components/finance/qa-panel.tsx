"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBanner } from "@/components/ui/status-banner";
import {
  addQaItemAction,
  createQaChecklistAction,
  toggleQaItemAction,
} from "@/server/finance/actions";

type QaPanelProps = {
  projectId: string;
  milestones: Array<{ id: string; title: string }>;
  checklists: Array<{
    id: string;
    title: string;
    milestone: { id: string; title: string } | null;
    items: Array<{ id: string; title: string; isDone: boolean }>;
  }>;
};

export function QaPanel({ projectId, milestones, checklists }: QaPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}

      <form
        className="space-y-3 border-b border-border pb-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          formData.set("projectId", projectId);
          setError(null);
          startTransition(async () => {
            const result = await createQaChecklistAction(formData);
            if (!result.ok) {
              setError(result.message);
              return;
            }
            event.currentTarget.reset();
            router.refresh();
          });
        }}
      >
        <Label htmlFor="qa-title">New checklist</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input id="qa-title" name="title" required placeholder="Launch checklist" />
          <Select name="milestoneId" defaultValue="" className="sm:w-48">
            <option value="">No milestone</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </Select>
          <Button type="submit" size="sm" disabled={pending}>
            Add
          </Button>
        </div>
      </form>

      {checklists.length === 0 ? (
        <p className="text-sm text-foreground-muted">No QA checklists yet.</p>
      ) : (
        <ul className="space-y-5">
          {checklists.map((checklist) => (
            <li key={checklist.id} className="space-y-3">
              <div>
                <p className="font-medium">{checklist.title}</p>
                {checklist.milestone ? (
                  <p className="text-xs text-foreground-muted">
                    Milestone: {checklist.milestone.title}
                  </p>
                ) : null}
              </div>
              <ul className="space-y-2">
                {checklist.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.isDone}
                      disabled={pending}
                      onChange={() => {
                        startTransition(async () => {
                          await toggleQaItemAction(item.id);
                          router.refresh();
                        });
                      }}
                    />
                    <span className={item.isDone ? "text-foreground-muted line-through" : ""}>
                      {item.title}
                    </span>
                  </li>
                ))}
              </ul>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  formData.set("checklistId", checklist.id);
                  startTransition(async () => {
                    const result = await addQaItemAction(formData);
                    if (!result.ok) {
                      setError(result.message);
                      return;
                    }
                    event.currentTarget.reset();
                    router.refresh();
                  });
                }}
              >
                <Input name="title" required placeholder="Add item" className="flex-1" />
                <Button type="submit" size="sm" variant="secondary" disabled={pending}>
                  Add item
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
