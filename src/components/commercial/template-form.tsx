"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { COMMERCIAL_DOC_TYPES, typeLabels } from "@/lib/commercial/meta";
import { useActionFeedback } from "@/lib/use-action-feedback";
import {
  createTemplateAction,
  deactivateTemplateAction,
  updateTemplateAction,
} from "@/server/commercial/actions";

type TemplateFormProps = {
  mode: "create" | "edit";
  templateId?: string;
  defaults?: {
    type?: string;
    name?: string;
    bodyHtml?: string | null;
    defaultPaymentTerms?: string | null;
    defaultNotes?: string | null;
    isActive?: boolean;
  };
};

export function TemplateForm({ mode, templateId, defaults }: TemplateFormProps) {
  const { pending, fieldErrors, run } = useActionFeedback();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    run(
      () =>
        mode === "create"
          ? createTemplateAction(formData)
          : updateTemplateAction(templateId!, formData),
      {
        successTitle: mode === "create" ? "Template added" : "Template saved",
        onSuccess: () => {
          if (mode === "create") form.reset();
        },
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`type-${templateId ?? "new"}`}>Type</Label>
          <Select
            id={`type-${templateId ?? "new"}`}
            name="type"
            required
            defaultValue={defaults?.type ?? "proposal"}
          >
            {COMMERCIAL_DOC_TYPES.map((type) => (
              <option key={type} value={type}>
                {typeLabels[type]}
              </option>
            ))}
          </Select>
          <FieldError errors={fieldErrors.type} />
        </div>
        <div>
          <Label htmlFor={`name-${templateId ?? "new"}`}>Name</Label>
          <Input
            id={`name-${templateId ?? "new"}`}
            name="name"
            required
            defaultValue={defaults?.name}
          />
          <FieldError errors={fieldErrors.name} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`terms-${templateId ?? "new"}`}>
            Default payment terms
          </Label>
          <Input
            id={`terms-${templateId ?? "new"}`}
            name="defaultPaymentTerms"
            defaultValue={defaults?.defaultPaymentTerms ?? undefined}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`notes-${templateId ?? "new"}`}>Default notes</Label>
          <Textarea
            id={`notes-${templateId ?? "new"}`}
            name="defaultNotes"
            rows={2}
            defaultValue={defaults?.defaultNotes ?? undefined}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`body-${templateId ?? "new"}`}>Default body</Label>
          <Textarea
            id={`body-${templateId ?? "new"}`}
            name="bodyHtml"
            rows={3}
            defaultValue={defaults?.bodyHtml ?? undefined}
          />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="isActive"
            value="true"
            defaultChecked={defaults?.isActive ?? true}
          />
          Active
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending} size="sm">
          {pending ? "Saving…" : mode === "create" ? "Add template" : "Save"}
        </Button>
        {mode === "edit" && defaults?.isActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={pending}
            onClick={() =>
              run(() => deactivateTemplateAction(templateId!), {
                successTitle: "Template deactivated",
              })
            }
          >
            Deactivate
          </Button>
        ) : null}
      </div>
    </form>
  );
}
