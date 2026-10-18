"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { triggerBackupAction } from "@/server/settings/actions";

export function BackupTriggerForm() {
  const { pending, run } = useActionFeedback();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(() => triggerBackupAction(formData), {
      successTitle: "Backup finished",
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label htmlFor="kind">Backup kind</Label>
        <Select id="kind" name="kind" defaultValue="full">
          <option value="full">Full (DB snapshot + file inventory)</option>
          <option value="db">Database logical snapshot</option>
          <option value="files">File inventory</option>
        </Select>
      </div>
      <Button type="submit" loading={pending}>
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
