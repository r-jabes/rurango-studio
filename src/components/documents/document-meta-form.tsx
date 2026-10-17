"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBanner } from "@/components/ui/status-banner";
import type { FieldErrors } from "@/lib/action-result";
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [clientId, setClientId] = useState(defaults.clientId ?? "");

  const filteredProjects = clientId
    ? projects.filter((project) => project.clientId === clientId)
    : projects;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setMessage(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateDocumentMetaAction(documentId, formData);
      if (!result.ok) {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      setMessage(result.message ?? "Saved.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}
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
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}
