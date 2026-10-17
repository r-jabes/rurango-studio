import Link from "next/link";
import { notFound } from "next/navigation";
import { CmsEntryForm } from "@/components/cms/cms-entry-form";
import { CmsStatusActions } from "@/components/cms/cms-status-actions";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import {
  cmsStatusTone,
  cmsTypeLabels,
  cmsTypeRoutes,
  type CmsEntryType,
} from "@/lib/cms/meta";
import { requireRole } from "@/lib/session";
import { getCmsEntry } from "@/server/cms/queries";

export async function CmsDetailPage({
  type,
  id,
}: {
  type: CmsEntryType;
  id: string;
}) {
  await requireRole(["owner", "member"]);
  const entry = await getCmsEntry(id);
  if (!entry || entry.type !== type) notFound();

  const base = cmsTypeRoutes[type];
  const tags = entry.tagLinks.map((link) => link.tag.name);

  return (
    <div className="space-y-6">
      <PageHeader
        title={entry.title}
        description={`${cmsTypeLabels[type]} · ${entry.slug}`}
        actions={
          <ButtonLink href={base} variant="ghost">
            Back to list
          </ButtonLink>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={cmsStatusTone(entry.status)}>{entry.status}</Badge>
        {entry.publishedAt ? (
          <span className="text-sm text-foreground-secondary">
            Published{" "}
            {entry.publishedAt.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <CmsEntryForm
          mode="edit"
          type={type}
          entryId={entry.id}
          locked={entry.status === "published"}
          defaults={{
            title: entry.title,
            slug: entry.slug,
            seoTitle: entry.seoTitle,
            seoDescription: entry.seoDescription,
            coverPublicPath: entry.coverPublicPath,
            tags,
            body: entry.bodyJson as Record<string, unknown>,
          }}
        />

        <div className="space-y-4">
          <CmsStatusActions
            entryId={entry.id}
            currentStatus={entry.status}
            type={entry.type}
          />

          <div className="rounded-md border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground-secondary">
              History
            </h2>
            <ul className="space-y-2 text-sm">
              {entry.publishEvents.length === 0 ? (
                <li className="text-foreground-muted">No events yet.</li>
              ) : (
                entry.publishEvents.map((event) => (
                  <li key={event.id} className="border-t border-border pt-2 first:border-0 first:pt-0">
                    <p className="font-medium">{event.action}</p>
                    <p className="text-xs text-foreground-muted">
                      {event.actor?.name ?? "System"} ·{" "}
                      {event.createdAt.toLocaleString()}
                    </p>
                    {event.note ? (
                      <p className="mt-1 text-foreground-secondary">{event.note}</p>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </div>

          <p className="text-xs text-foreground-muted">
            Created by {entry.creator?.name ?? "Unknown"}.{" "}
            <Link href="/content" className="underline underline-offset-2">
              Content hub
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
