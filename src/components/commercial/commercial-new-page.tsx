import { CommercialDocForm } from "@/components/commercial/commercial-doc-form";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";
import {
  isCoreCommercialType,
  typeDescriptions,
  typeLabels,
  typeRoutes,
  type PrimaryCommercialType,
} from "@/lib/commercial/meta";
import { requireRole } from "@/lib/session";
import { listClientOptions, listProjectOptions } from "@/server/documents/options";
import { listTemplates } from "@/server/commercial/queries";
import { db } from "@/db";
import Link from "next/link";

export async function CommercialNewPage({
  type,
}: {
  type: PrimaryCommercialType;
}) {
  await requireRole(["owner", "member"]);
  const [clients, projects, templates, settings] = await Promise.all([
    listClientOptions(),
    listProjectOptions(),
    listTemplates(type),
    db.query.companySettings.findFirst(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`New ${typeLabels[type].toLowerCase()}`}
        description={`${typeDescriptions[type]} Issuing freezes commercial numbers into a snapshot and branded PDF.`}
      />
      {!isCoreCommercialType(type) ? (
        <StatusBanner tone="info">
          Need a firm price instead?{" "}
          <Link
            href="/quotations/new"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Start from a quotation
          </Link>
          . Proposals and agreements are optional for larger or less-defined work.
        </StatusBanner>
      ) : null}
      <CommercialDocForm
        mode="create"
        type={type}
        clients={clients}
        projects={projects}
        templates={templates}
        defaultCurrency={settings?.defaultCurrency ?? "RWF"}
      />
      <p className="text-xs text-foreground-secondary">
        After save you can issue from the detail page. Number series uses{" "}
        <code className="font-mono">{typeRoutes[type]}</code> prefixes from
        company settings.
      </p>
    </div>
  );
}
