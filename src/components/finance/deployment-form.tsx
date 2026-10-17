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
import { createDeploymentAction } from "@/server/finance/actions";

export function DeploymentForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("projectId", projectId);
    setError(null);
    setMessage(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createDeploymentAction(formData);
      if (!result.ok) {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      setMessage(result.message ?? "Saved.");
      event.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="environment">Environment</Label>
          <Input id="environment" name="environment" placeholder="production, staging…" />
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
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Add deployment"}
      </Button>
    </form>
  );
}
