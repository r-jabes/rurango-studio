import { TemplateForm } from "@/components/commercial/template-form";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";
import { db } from "@/db";
import { typeLabels } from "@/lib/commercial/meta";
import { requireSession } from "@/lib/session";
import { listAllTemplates } from "@/server/commercial/queries";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireSession();

  let settings:
    | {
        legalName: string;
        tradingName: string;
        defaultCurrency: string;
        invoicePrefix: string;
        quotationPrefix: string;
        proposalPrefix: string;
        agreementPrefix: string;
      }
    | null = null;
  let settingsError: string | null = null;
  let templates: Awaited<ReturnType<typeof listAllTemplates>> = [];

  try {
    settings = (await db.query.companySettings.findFirst()) ?? null;
    templates = await listAllTemplates();
  } catch {
    settingsError =
      "Could not load company settings. Confirm DATABASE_URL and that migrations have been applied.";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Company profile, document numbering, and reusable commercial templates."
      />

      <section className="rounded-xl border border-border bg-surface/50 p-5">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-medium">Signed-in account</h2>
          <Badge>{String(session.user.role ?? "owner")}</Badge>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-foreground-muted">Name</dt>
            <dd className="text-foreground">{session.user.name}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">Email</dt>
            <dd className="text-foreground">{session.user.email}</dd>
          </div>
        </dl>
      </section>

      {settingsError ? (
        <StatusBanner tone="warning">{settingsError}</StatusBanner>
      ) : null}

      {settings ? (
        <section className="rounded-xl border border-border bg-surface/50 p-5">
          <h2 className="mb-4 text-sm font-medium">Company</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-foreground-muted">Legal name</dt>
              <dd>{settings.legalName}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Trading name</dt>
              <dd>{settings.tradingName}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Default currency</dt>
              <dd>{settings.defaultCurrency}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Document prefixes</dt>
              <dd className="font-mono text-xs">
                {settings.proposalPrefix} / {settings.quotationPrefix} /{" "}
                {settings.agreementPrefix} / {settings.invoicePrefix}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-foreground-muted">
            Prefixes drive issued numbers (e.g. INV-2026-0001). Seed or update
            the company_settings row to change them.
          </p>
        </section>
      ) : !settingsError ? (
        <StatusBanner tone="info">
          No company settings row yet. Run{" "}
          <code className="font-mono text-accent">npm run db:seed</code> in
          development after migrations.
        </StatusBanner>
      ) : null}

      {!settingsError ? (
        <section className="space-y-4 rounded-xl border border-border bg-surface/50 p-5">
          <div>
            <h2 className="text-sm font-medium">Document templates</h2>
            <p className="mt-1 text-xs text-foreground-muted">
              Reusable defaults for proposals, quotations, agreements, invoices,
              receipts, and handover notes.
            </p>
          </div>

          <TemplateForm mode="create" />

          <ul className="space-y-4">
            {templates.map((template) => (
              <li
                key={template.id}
                className="rounded-md border border-border bg-background p-4"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="font-medium">{template.name}</span>
                  <Badge tone={template.isActive ? "success" : "neutral"}>
                    {typeLabels[template.type]}
                  </Badge>
                  {!template.isActive ? (
                    <Badge tone="neutral">inactive</Badge>
                  ) : null}
                </div>
                <TemplateForm
                  mode="edit"
                  templateId={template.id}
                  defaults={{
                    type: template.type,
                    name: template.name,
                    bodyHtml: template.bodyHtml,
                    defaultPaymentTerms: template.defaultPaymentTerms,
                    defaultNotes: template.defaultNotes,
                    isActive: template.isActive,
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
