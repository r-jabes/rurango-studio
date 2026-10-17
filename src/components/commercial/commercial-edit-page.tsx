import { notFound, redirect } from "next/navigation";
import { CommercialDocForm } from "@/components/commercial/commercial-doc-form";
import { PageHeader } from "@/components/ui/page-header";
import {
  isEditableStatus,
  typeLabels,
  typeRoutes,
  type PrimaryCommercialType,
} from "@/lib/commercial/meta";
import { requireRole } from "@/lib/session";
import { listClientOptions, listProjectOptions } from "@/server/documents/options";
import {
  getCommercialDocument,
  listTemplates,
} from "@/server/commercial/queries";
import { db } from "@/db";

export async function CommercialEditPage({
  type,
  id,
}: {
  type: PrimaryCommercialType;
  id: string;
}) {
  await requireRole(["owner", "member"]);
  const doc = await getCommercialDocument(id);
  if (!doc || doc.type !== type) notFound();
  if (!isEditableStatus(doc.status)) {
    redirect(`${typeRoutes[type]}/${id}`);
  }

  const [clients, projects, templates, settings] = await Promise.all([
    listClientOptions(),
    listProjectOptions(),
    listTemplates(type),
    db.query.companySettings.findFirst(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${typeLabels[type].toLowerCase()}`}
        description={`${doc.number} · draft only`}
      />
      <CommercialDocForm
        mode="edit"
        type={type}
        documentId={doc.id}
        clients={clients}
        projects={projects}
        templates={templates}
        defaultCurrency={settings?.defaultCurrency ?? "RWF"}
        defaults={{
          title: doc.title,
          clientId: doc.clientId,
          projectId: doc.projectId,
          templateId: doc.templateId,
          currency: doc.currency,
          issueDate: doc.issueDate,
          dueDate: doc.dueDate,
          expiryDate: doc.expiryDate,
          paymentTerms: doc.paymentTerms,
          notes: doc.notes,
          bodyHtml: doc.bodyHtml,
          lineItems: doc.lineItems,
        }}
      />
    </div>
  );
}
