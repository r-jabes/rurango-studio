"use client";

import { useMemo, useState } from "react";
import {
  LineItemsEditor,
  type LineItemDraft,
} from "@/components/commercial/line-items-editor";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { FieldHint } from "@/components/ui/field-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBanner } from "@/components/ui/status-banner";
import { Textarea } from "@/components/ui/textarea";
import {
  typeGuidance,
  typeLabels,
  typeRoutes,
  type PrimaryCommercialType,
} from "@/lib/commercial/meta";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { minorToMajorString } from "@/lib/money";
import {
  createCommercialDocumentAction,
  updateCommercialDocumentAction,
} from "@/server/commercial/actions";

type Option = { id: string; name: string; clientId?: string };
type TemplateOption = {
  id: string;
  name: string;
  defaultPaymentTerms: string | null;
  defaultNotes: string | null;
  bodyHtml: string | null;
};

type CommercialDocFormProps = {
  mode: "create" | "edit";
  type: PrimaryCommercialType;
  documentId?: string;
  clients: Option[];
  projects: Option[];
  templates: TemplateOption[];
  defaultCurrency: string;
  defaults?: {
    title?: string;
    clientId?: string;
    projectId?: string | null;
    templateId?: string | null;
    currency?: string;
    issueDate?: string | null;
    dueDate?: string | null;
    expiryDate?: string | null;
    paymentTerms?: string | null;
    notes?: string | null;
    bodyHtml?: string | null;
    lineItems?: Array<{
      description: string;
      quantity: string;
      unitAmountMinor: number;
      taxRateBps: number;
    }>;
  };
};

export function CommercialDocForm({
  mode,
  type,
  documentId,
  clients,
  projects,
  templates,
  defaultCurrency,
  defaults,
}: CommercialDocFormProps) {
  const guide = typeGuidance[type];
  const { pending, fieldErrors, run, router } = useActionFeedback();
  const [clientId, setClientId] = useState(defaults?.clientId ?? "");
  const [currency, setCurrency] = useState(
    defaults?.currency ?? defaultCurrency,
  );
  const [paymentTerms, setPaymentTerms] = useState(
    defaults?.paymentTerms ?? "",
  );
  const [notes, setNotes] = useState(defaults?.notes ?? "");
  const [bodyHtml, setBodyHtml] = useState(defaults?.bodyHtml ?? "");

  const filteredProjects = useMemo(
    () => projects.filter((p) => !clientId || p.clientId === clientId),
    [projects, clientId],
  );

  const defaultLineItems: LineItemDraft[] | undefined = defaults?.lineItems?.map(
    (line) => ({
      key: crypto.randomUUID(),
      description: line.description,
      quantity: line.quantity,
      unitAmountMajor: minorToMajorString(line.unitAmountMinor),
      taxRatePercent: String(line.taxRateBps / 100),
    }),
  );

  function onTemplateChange(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    if (template.defaultPaymentTerms) {
      setPaymentTerms(template.defaultPaymentTerms);
    }
    if (template.defaultNotes) setNotes(template.defaultNotes);
    if (template.bodyHtml) setBodyHtml(template.bodyHtml);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("type", type);
    formData.set("currency", currency);
    formData.set("paymentTerms", paymentTerms);
    formData.set("notes", notes);
    formData.set("bodyHtml", bodyHtml);

    run(
      () =>
        mode === "create"
          ? createCommercialDocumentAction(formData)
          : updateCommercialDocumentAction(documentId!, formData),
      {
        successTitle:
          mode === "create"
            ? `${typeLabels[type]} created`
            : `${typeLabels[type]} saved`,
        refresh: mode !== "create",
        onSuccess: (result) => {
          if (
            mode === "create" &&
            result.data &&
            typeof result.data === "object" &&
            "id" in result.data
          ) {
            router.push(
              `${typeRoutes[type]}/${String((result.data as { id: string }).id)}`,
            );
            router.refresh();
          }
        },
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <StatusBanner tone="info">{guide.summary}</StatusBanner>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <FieldHint>{guide.titleHint}</FieldHint>
          <Input
            id="title"
            name="title"
            required
            defaultValue={defaults?.title}
            placeholder={guide.titleHint}
          />
          <FieldError errors={fieldErrors.title} />
        </div>

        <div>
          <Label htmlFor="clientId">Client</Label>
          <FieldHint>The party this document is addressed to.</FieldHint>
          <Select
            id="clientId"
            name="clientId"
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
          <FieldError errors={fieldErrors.clientId} />
        </div>

        <div>
          <Label htmlFor="projectId">Project (optional)</Label>
          <FieldHint>Link to an internal CRM project when this work is tracked there.</FieldHint>
          <Select
            id="projectId"
            name="projectId"
            defaultValue={defaults?.projectId ?? ""}
          >
            <option value="">No project</option>
            {filteredProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          <FieldError errors={fieldErrors.projectId} />
        </div>

        <div>
          <Label htmlFor="templateId">Template (optional)</Label>
          <FieldHint>Prefills payment terms, notes, and body from Settings → Templates.</FieldHint>
          <Select
            id="templateId"
            name="templateId"
            defaultValue={defaults?.templateId ?? ""}
            onChange={(e) => onTemplateChange(e.target.value)}
          >
            <option value="">No template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="currency">Currency</Label>
          <FieldHint>ISO code for line totals (e.g. RWF, USD).</FieldHint>
          <Input
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            required
          />
          <FieldError errors={fieldErrors.currency} />
        </div>

        <div>
          <Label htmlFor="issueDate">Issue date</Label>
          <FieldHint>{guide.issueDateHint}</FieldHint>
          <Input
            id="issueDate"
            name="issueDate"
            type="date"
            defaultValue={defaults?.issueDate ?? undefined}
          />
        </div>

        {guide.showDueDate ? (
          <div>
            <Label htmlFor="dueDate">Due date</Label>
            <FieldHint>{guide.dueDateHint}</FieldHint>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={defaults?.dueDate ?? undefined}
            />
          </div>
        ) : (
          <input type="hidden" name="dueDate" value={defaults?.dueDate ?? ""} />
        )}

        {guide.showExpiryDate ? (
          <div>
            <Label htmlFor="expiryDate">Expiry / validity date</Label>
            <FieldHint>{guide.expiryDateHint}</FieldHint>
            <Input
              id="expiryDate"
              name="expiryDate"
              type="date"
              defaultValue={defaults?.expiryDate ?? undefined}
            />
          </div>
        ) : (
          <input
            type="hidden"
            name="expiryDate"
            value={defaults?.expiryDate ?? ""}
          />
        )}

        <div className="sm:col-span-2">
          <Label htmlFor="paymentTerms">Payment terms</Label>
          <FieldHint>{guide.paymentTermsHint}</FieldHint>
          <Input
            id="paymentTerms"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            placeholder={guide.paymentTermsHint}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <FieldHint>{guide.notesHint}</FieldHint>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={guide.notesHint}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="bodyHtml">
            {guide.emphasizeBody ? "Scope / terms (primary narrative)" : "Body / description"}
          </Label>
          <FieldHint>{guide.bodyHint}</FieldHint>
          <Textarea
            id="bodyHtml"
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            rows={guide.emphasizeBody ? 8 : 4}
            placeholder={guide.bodyHint}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium text-foreground-secondary">Line items</p>
          <FieldHint>{guide.lineItemsHint}</FieldHint>
        </div>
        <LineItemsEditor currency={currency} defaultItems={defaultLineItems} />
        <FieldError errors={fieldErrors.lineItemsJson} />
      </div>

      <Button type="submit" loading={pending}>
        {pending
          ? "Saving…"
          : mode === "create"
            ? `Create ${typeLabels[type].toLowerCase()}`
            : "Save draft"}
      </Button>
    </form>
  );
}
