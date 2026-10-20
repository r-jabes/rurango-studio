import { TemplateForm } from "@/components/commercial/template-form";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";
import { MfaPanel } from "@/components/settings/mfa-panel";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";
import { typeLabels } from "@/lib/commercial/meta";
import { requireSession } from "@/lib/session";
import { listAllTemplates } from "@/server/commercial/queries";
import {
  getCompanySettings,
  listRecentAuditLogs,
} from "@/server/settings/queries";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireSession();
  const role =
    (session.user as typeof session.user & { role?: string }).role ?? "owner";
  const twoFactorEnabled = Boolean(
    (session.user as typeof session.user & { twoFactorEnabled?: boolean })
      .twoFactorEnabled,
  );

  let settings: Awaited<ReturnType<typeof getCompanySettings>> | null = null;
  let settingsError: string | null = null;
  let templates: Awaited<ReturnType<typeof listAllTemplates>> = [];
  let audit: Awaited<ReturnType<typeof listRecentAuditLogs>> = [];

  try {
    settings = await getCompanySettings();
    templates = await listAllTemplates();
    if (role === "owner") {
      audit = await listRecentAuditLogs(25);
    }
  } catch {
    settingsError =
      "Could not load company settings. Confirm DATABASE_URL and that migrations have been applied.";
  }

  const settingsDefaults = {
    legalName: settings?.legalName ?? "RURANGO",
    tradingName: settings?.tradingName ?? "RURANGO",
    defaultCurrency: settings?.defaultCurrency ?? "RWF",
    taxId: settings?.taxId ?? null,
    supportEmail: settings?.supportEmail ?? null,
    addressJson: settings?.addressJson ?? null,
    invoicePaymentDetails: settings?.invoicePaymentDetails ?? null,
    invoicePrefix: settings?.invoicePrefix ?? "INV",
    quotationPrefix: settings?.quotationPrefix ?? "QUO",
    proposalPrefix: settings?.proposalPrefix ?? "PRO",
    agreementPrefix: settings?.agreementPrefix ?? "AGR",
    uploadMaxBytes: settings?.uploadMaxBytes ?? 26_214_400,
    logoStorageKey: settings?.logoStorageKey ?? null,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Company profile, MFA, document templates, and recent audit events."
      />

      <section className="rounded-xl border border-border bg-surface/50 p-5">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-medium">Signed-in account</h2>
          <Badge>{String(role)}</Badge>
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

      <section className="rounded-xl border border-border bg-surface/50 p-5">
        <h2 className="mb-3 text-sm font-medium">Multi-factor authentication</h2>
        <MfaPanel enabled={twoFactorEnabled} />
      </section>

      {settingsError ? (
        <StatusBanner tone="warning">{settingsError}</StatusBanner>
      ) : (
        <section className="space-y-4 rounded-xl border border-border bg-surface/50 p-5">
          <h2 className="text-sm font-medium">Company</h2>
          {!settings ? (
            <StatusBanner tone="info">
              No company settings row yet — saving creates one.
            </StatusBanner>
          ) : null}
          <CompanySettingsForm defaults={settingsDefaults} />
        </section>
      )}

      {!settingsError ? (
        <section className="space-y-4 rounded-xl border border-border bg-surface/50 p-5">
          <div>
            <h2 className="text-sm font-medium">Document templates</h2>
            <p className="mt-1 text-xs text-foreground-muted">
              Reusable defaults for commercial documents.
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

      {role === "owner" ? (
        <section className="rounded-xl border border-border bg-surface/50 p-5">
          <h2 className="mb-3 text-sm font-medium">Recent audit events</h2>
          {audit.length === 0 ? (
            <p className="text-sm text-foreground-muted">No audit events yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {audit.map((row) => (
                <li
                  key={row.id}
                  className="border-t border-border pt-2 first:border-0 first:pt-0"
                >
                  <p className="font-medium">{row.action}</p>
                  <p className="text-xs text-foreground-muted">
                    {row.createdAt.toLocaleString()}
                    {row.entityType ? ` · ${row.entityType}` : ""}
                    {row.entityId ? ` · ${row.entityId}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
