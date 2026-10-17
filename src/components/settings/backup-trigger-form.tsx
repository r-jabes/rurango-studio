"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBanner } from "@/components/ui/status-banner";
import { triggerBackupAction } from "@/server/settings/actions";

export function BackupTriggerForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await triggerBackupAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage(result.message ?? "Backup completed.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}
      <div>
        <Label htmlFor="kind">Backup kind</Label>
        <Select id="kind" name="kind" defaultValue="full">
          <option value="full">Full (DB snapshot + file inventory)</option>
          <option value="db">Database logical snapshot</option>
          <option value="files">File inventory</option>
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Running…" : "Run backup now"}
      </Button>
      <p className="text-xs text-foreground-muted">
        Writes a JSON artifact under <code className="font-mono">backups/</code>{" "}
        in Studio storage. This is a recovery drill aid — keep provider PITR
        enabled for production database restore.
      </p>
    </form>
  );
}
