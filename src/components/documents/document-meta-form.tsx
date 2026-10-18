"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { updateDocumentMetaAction } from "@/server/documents/actions";

type Option = { id: string; name: string };

type DocumentMetaFormProps = {
  documentId: string;
  categories: Option[];
  clients: Option[];
  projects: Array<Option & { clientId: string }>;
  defaults: {
    title: string;
    categoryId?: string | null;
    clientId?: string | null;
    projectId?: string | null;
    tags: string;
  };
};

export function DocumentMetaForm({
  documentId,
  categories,
  clients,
  projects,
  defaults,
}: DocumentMetaFormProps) {
  const { pending, fieldErrors, run } = useActionFeedback();
  const [clientId, setClientId] = useState(defaults.clientId ?? "");

  const filteredProjects = clientId
    ? projects.filter((project) => project.clientId === clientId)
    : projects;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    run(() => updateDocumentMetaAction(documentId, formData), {
      successTitle: "Details saved",
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required defaultValue={defaults.title} />
        <FieldError errors={fieldErrors.title} />
      </div>
      <div>
        <Label htmlFor="categoryId">Category</Label>
        <Select
          id="categoryId"
          name="categoryId"
          defaultValue={defaults.categoryId ?? ""}
        >
          <option value="">Uncategorized</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>
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
        <Select
          id="projectId"
          name="projectId"
          defaultValue={defaults.projectId ?? ""}
        >
          <option value="">None</option>
          {filteredProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" name="tags" defaultValue={defaults.tags} />
      </div>
      <Button type="submit" size="sm" loading={pending}>
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}
