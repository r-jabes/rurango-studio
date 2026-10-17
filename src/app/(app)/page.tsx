import Link from "next/link";
import { count, eq, ne } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";
import { db } from "@/db";
import { clients, projects } from "@/db/schema";
import { primaryNav } from "@/lib/navigation";
import { requireSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await requireSession();

  let activeClients: number | null = null;
  let openProjects: number | null = null;
  let loadError: string | null = null;

  try {
    const [clientCount, projectCount] = await Promise.all([
      db
        .select({ value: count() })
        .from(clients)
        .where(eq(clients.status, "active")),
      db
        .select({ value: count() })
        .from(projects)
        .where(ne(projects.status, "archived")),
    ]);
    activeClients = clientCount[0]?.value ?? 0;
    openProjects = projectCount[0]?.value ?? 0;
  } catch {
    loadError =
      "Could not load live counts. Confirm the database is migrated and reachable.";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Signed in as ${session.user.name}.`}
      />

      {loadError ? (
        <StatusBanner tone="warning">{loadError}</StatusBanner>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface/50 p-5">
            <p className="text-xs uppercase tracking-wide text-foreground-muted">
              Active clients
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {activeClients}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface/50 p-5">
            <p className="text-xs uppercase tracking-wide text-foreground-muted">
              Open projects
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {openProjects}
            </p>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-foreground">Modules</h2>
          <Badge tone="accent">Studio</Badge>
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
