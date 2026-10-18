"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { createDocumentAction } from "@/server/documents/actions";

type Option = { id: string; name: string };

type UploadFormProps = {
  categories: Option[];
  clients: Option[];
  projects: Array<Option & { clientId: string }>;
};

export function UploadForm({ categories, clients, projects }: UploadFormProps) {
  const { pending, fieldErrors, run, router } = useActionFeedback();
  const [clientId, setClientId] = useState("");

  const filteredProjects = clientId
    ? projects.filter((project) => project.clientId === clientId)
    : projects;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    run(() => createDocumentAction(formData), {
      successTitle: "Document uploaded",
      refresh: false,
      onSuccess: (result) => {
        if (
          result.data &&
          typeof result.data === "object" &&
          "id" in result.data
        ) {
          router.push(`/documents/${String((result.data as { id: string }).id)}`);
          router.refresh();
        }
      },
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
        <FieldError errors={fieldErrors.title} />
      </div>

      <div>
        <Label htmlFor="file">File</Label>
        <Input id="file" name="file" type="file" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" name="categoryId" defaultValue="">
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            placeholder="contracts, kigali, 2026"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="clientId">Client</Label>
          <Select
            id="clientId"
            name="clientId"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
          >
            <option value="">None</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="projectId">Project</Label>
          <Select id="projectId" name="projectId" defaultValue="">
            <option value="">None</option>
            {filteredProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="changeNote">Note</Label>
        <Input
          id="changeNote"
          name="changeNote"
          placeholder="Optional note for this upload"
        />
      </div>

      <Button type="submit" loading={pending}>
        {pending ? "Uploading…" : "Upload to vault"}
      </Button>
    </form>
  );
}
