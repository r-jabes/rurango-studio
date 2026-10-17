"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBanner } from "@/components/ui/status-banner";
import { Textarea } from "@/components/ui/textarea";
import { recordHandoverAction } from "@/server/finance/actions";

export function HandoverForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("projectId", projectId);
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await recordHandoverAction(formData);
      if (!result.ok) {
        setError(result.message);
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
          <Label htmlFor="acceptedByName">Accepted by</Label>
          <Input id="acceptedByName" name="acceptedByName" />
        </div>
        <div>
          <Label htmlFor="acceptedAt">Accepted at</Label>
          <Input id="acceptedAt" name="acceptedAt" type="datetime-local" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="file">Optional artifact</Label>
          <Input id="file" name="file" type="file" />
          <p className="mt-1 text-xs text-foreground-muted">
            Stores a handover file reference — not a legally binding e-signature.
          </p>
        </div>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Record handover"}
      </Button>
    </form>
  );
}
