"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBanner } from "@/components/ui/status-banner";
import { uploadDocumentVersionAction } from "@/server/documents/actions";

type VersionUploadFormProps = {
  documentId: string;
};

export function VersionUploadForm({ documentId }: VersionUploadFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await uploadDocumentVersionAction(documentId, formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage(result.message ?? "Version uploaded.");
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}
      <div>
        <Label htmlFor="file">New version file</Label>
        <Input id="file" name="file" type="file" required />
      </div>
      <div>
        <Label htmlFor="changeNote">Change note</Label>
        <Input id="changeNote" name="changeNote" placeholder="What changed?" />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Uploading…" : "Upload new version"}
      </Button>
      <p className="text-xs text-foreground-muted">
        Previous versions stay in storage and remain downloadable.
      </p>
    </form>
  );
}
