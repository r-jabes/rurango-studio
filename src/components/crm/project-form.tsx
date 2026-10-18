"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/lib/use-action-feedback";
import {
  createProjectAction,
  updateProjectAction,
} from "@/server/crm/actions";

type ClientOption = { id: string; name: string };

type ProjectFormProps = {
  mode: "create" | "edit";
  projectId?: string;
  clients: ClientOption[];
  defaults?: {
    clientId?: string;
    name?: string;
    code?: string | null;
    description?: string | null;
    status?: string;
    startsOn?: string | null;
    dueOn?: string | null;
    budgetAmountMinor?: number | null;
    budgetCurrency?: string | null;
  };
};

export function ProjectForm({
  mode,
  projectId,
  clients,
  defaults,
}: ProjectFormProps) {
  const { pending, fieldErrors, run, router } = useActionFeedback();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    run(
      () =>
        mode === "create"
          ? createProjectAction(formData)
          : updateProjectAction(projectId!, formData),
      {
        successTitle: mode === "create" ? "Project created" : "Project updated",
        refresh: mode !== "create",
        onSuccess: (result) => {
          if (
            mode === "create" &&
            result.data &&
            typeof result.data === "object" &&
            "id" in result.data
          ) {
            router.push(`/projects/${String((result.data as { id: string }).id)}`);
            router.refresh();
          }
        },
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">

      <div>
        <Label htmlFor="clientId">Client</Label>
        <Select
          id="clientId"
          name="clientId"
          required
          defaultValue={defaults?.clientId}
        >
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </Select>
        <FieldError errors={fieldErrors.clientId} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Project name</Label>
          <Input id="name" name="name" required defaultValue={defaults?.name} />
          <FieldError errors={fieldErrors.name} />
        </div>
        <div>
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            name="code"
            defaultValue={defaults?.code ?? undefined}
          />
          <FieldError errors={fieldErrors.code} />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaults?.description ?? undefined}
        />
        <FieldError errors={fieldErrors.description} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            defaultValue={defaults?.status ?? "planned"}
          >
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="startsOn">Starts on</Label>
          <Input
            id="startsOn"
            name="startsOn"
            type="date"
            defaultValue={defaults?.startsOn ?? undefined}
          />
        </div>
        <div>
          <Label htmlFor="dueOn">Due on</Label>
          <Input
            id="dueOn"
            name="dueOn"
            type="date"
            defaultValue={defaults?.dueOn ?? undefined}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="budgetAmountMinor">Budget (minor units)</Label>
          <Input
            id="budgetAmountMinor"
            name="budgetAmountMinor"
            inputMode="numeric"
            defaultValue={
              defaults?.budgetAmountMinor != null
                ? String(defaults.budgetAmountMinor)
                : undefined
            }
          />
          <FieldError errors={fieldErrors.budgetAmountMinor} />
        </div>
        <div>
          <Label htmlFor="budgetCurrency">Currency</Label>
          <Input
            id="budgetCurrency"
            name="budgetCurrency"
            defaultValue={defaults?.budgetCurrency ?? "RWF"}
            maxLength={3}
          />
        </div>
      </div>
      <Button type="submit" loading={pending}>
        {pending
          ? "Saving…"
          : mode === "create"
            ? "Create project"
            : "Save changes"}
      </Button>
    </form>
  );
}
