import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";
import { primaryNav } from "@/lib/navigation";
import { requireSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await requireSession();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Signed in as ${session.user.name}. Studio foundation is ready — business records arrive in later phases.`}
      />

      <StatusBanner tone="info">
        No operational metrics are shown yet. Counts and financial totals will
        appear only when they reflect real data from clients, projects, and
        invoices.
      </StatusBanner>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-foreground">Module map</h2>
          <Badge tone="accent">Phase 1</Badge>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {primaryNav
            .filter((item) => item.href !== "/")
            .map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block h-full rounded-xl border border-border bg-surface/60 p-4 transition-colors hover:border-border-strong hover:bg-surface"
                >
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    {item.description}
                  </p>
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
