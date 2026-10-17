import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";
import { db } from "@/db";
import { requireSession } from "@/lib/session";

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

  try {
    settings = (await db.query.companySettings.findFirst()) ?? null;
  } catch {
    settingsError =
      "Could not load company settings. Confirm DATABASE_URL and that migrations have been applied.";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Company profile, document numbering, and Studio configuration."
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
            Editable company settings forms ship with commercial documents and
            branding in Phase 4.
          </p>
        </section>
      ) : !settingsError ? (
        <StatusBanner tone="info">
          No company settings row yet. Run{" "}
          <code className="font-mono text-accent">npm run db:seed</code> in
          development after migrations.
        </StatusBanner>
      ) : null}
    </div>
  );
}
