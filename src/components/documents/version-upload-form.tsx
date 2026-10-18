"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { uploadDocumentVersionAction } from "@/server/documents/actions";

type VersionUploadFormProps = {
  documentId: string;
};

export function VersionUploadForm({ documentId }: VersionUploadFormProps) {
  const { pending, run } = useActionFeedback();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    run(() => uploadDocumentVersionAction(documentId, formData), {
      successTitle: "Version uploaded",
      onSuccess: () => form.reset(),
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label htmlFor="file">New version file</Label>
        <Input id="file" name="file" type="file" required />
      </div>
      <div>
        <Label htmlFor="changeNote">Change note</Label>
        <Input id="changeNote" name="changeNote" placeholder="What changed?" />
      </div>
      <Button type="submit" size="sm" loading={pending}>
        {pending ? "Uploading…" : "Upload new version"}
      </Button>
      <p className="text-xs text-foreground-muted">
        Previous versions stay in storage and remain downloadable.
      </p>
    </form>
  );
}
