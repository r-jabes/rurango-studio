import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";
import { CMS_ENTRY_TYPES, cmsTypeLabels, cmsTypeRoutes } from "@/lib/cms/meta";
import { requireRole } from "@/lib/session";
import { countCmsByStatus } from "@/server/cms/queries";

export const metadata = { title: "Content" };

export default async function ContentHubPage() {
  await requireRole(["owner", "member"]);

  let counts: Partial<Record<string, number>> = {};
  let loadError: string | null = null;
  try {
    counts = await countCmsByStatus();
  } catch {
    loadError =
      "Could not load CMS counts. Confirm migrations through 0005 have been applied.";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content"
        description="Draft portfolio projects, services, posts, and client-approved testimonials. Only published portfolio projects flow to the public site via the content pull contract."
      />

      {loadError ? <StatusBanner tone="warning">{loadError}</StatusBanner> : null}

      <div className="flex flex-wrap gap-2">
        {(["draft", "in_review", "published", "archived"] as const).map((status) => (
          <Badge key={status} tone="neutral">
            {status}: {counts[status] ?? 0}
          </Badge>
        ))}
      </div>

      <StatusBanner tone="info">
        Publish contract: Studio exposes{" "}
        <code className="font-mono text-accent">
          GET /api/public/content/projects
        </code>{" "}
        (Bearer <code className="font-mono">CMS_CONTENT_TOKEN</code>). In{" "}
        <code className="font-mono">web/</code>, run{" "}
        <code className="font-mono text-accent">npm run content:pull</code> to
        write supplemental projects. Static{" "}
        <code className="font-mono">projects.ts</code> entries still win on
        slug conflicts. Testimonials are never exported publicly in Phase 6.
      </StatusBanner>

      <ul className="grid gap-3 sm:grid-cols-2">
        {CMS_ENTRY_TYPES.map((type) => (
          <li key={type}>
            <Link
              href={cmsTypeRoutes[type]}
              className="block rounded-xl border border-border bg-surface/60 p-4 transition-colors hover:border-border-strong hover:bg-surface"
            >
              <p className="font-medium">{cmsTypeLabels[type]}</p>
              <p className="mt-1 text-sm text-foreground-secondary">
                Manage drafts and publish workflow for {cmsTypeLabels[type].toLowerCase()}.
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
