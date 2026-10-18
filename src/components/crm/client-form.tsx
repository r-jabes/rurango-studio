"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/lib/use-action-feedback";
import {
  createClientAction,
  updateClientAction,
} from "@/server/crm/actions";

type ClientFormProps = {
  mode: "create" | "edit";
  clientId?: string;
  defaults?: {
    name?: string;
    legalName?: string | null;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
  };
};

export function ClientForm({ mode, clientId, defaults }: ClientFormProps) {
  const { pending, fieldErrors, run, router } = useActionFeedback();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    run(
      () =>
        mode === "create"
          ? createClientAction(formData)
          : updateClientAction(clientId!, formData),
      {
        successTitle: mode === "create" ? "Client created" : "Client updated",
        refresh: mode !== "create",
        onSuccess: (result) => {
          if (mode === "create" && result.data && typeof result.data === "object" && "id" in result.data) {
            router.push(`/clients/${String((result.data as { id: string }).id)}`);
            router.refresh();
          }
        },
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required defaultValue={defaults?.name} />
        <FieldError errors={fieldErrors.name} />
      </div>
      <div>
        <Label htmlFor="legalName">Legal name</Label>
        <Input
          id="legalName"
          name="legalName"
          defaultValue={defaults?.legalName ?? undefined}
        />
        <FieldError errors={fieldErrors.legalName} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaults?.email ?? undefined}
          />
          <FieldError errors={fieldErrors.email} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={defaults?.phone ?? undefined}
          />
          <FieldError errors={fieldErrors.phone} />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Internal notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={defaults?.notes ?? undefined}
        />
        <FieldError errors={fieldErrors.notes} />
      </div>
      <Button type="submit" loading={pending}>
        {pending
          ? "Saving…"
          : mode === "create"
            ? "Create client"
            : "Save changes"}
      </Button>
    </form>
  );
}
