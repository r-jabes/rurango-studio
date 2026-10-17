"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBanner } from "@/components/ui/status-banner";
import { Textarea } from "@/components/ui/textarea";
import type { FieldErrors } from "@/lib/action-result";
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage(null);
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createClientAction(formData)
          : await updateClientAction(clientId!, formData);

      if (!result.ok) {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setMessage(result.message ?? "Saved.");
      if (mode === "create" && result.data?.id) {
        router.push(`/clients/${result.data.id}`);
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}

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
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : mode === "create" ? "Create client" : "Save changes"}
      </Button>
    </form>
  );
}
