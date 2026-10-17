import Link from "next/link";
import { ListFilters } from "@/components/crm/list-filters";
import { PaginationLinks } from "@/components/crm/pagination-links";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  cmsStatusTone,
  cmsTypeLabels,
  cmsTypeRoutes,
  type CmsEntryStatus,
  type CmsEntryType,
} from "@/lib/cms/meta";
import { requireRole } from "@/lib/session";
import { listCmsEntries } from "@/server/cms/queries";

export async function CmsListPage({
  type,
  searchParams,
}: {
  type: CmsEntryType;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireRole(["owner", "member"]);
  const params = await searchParams;
  const status =
    params.status &&
    ["draft", "in_review", "published", "archived", "all"].includes(params.status)
      ? (params.status as CmsEntryStatus | "all")
      : "all";

  const result = await listCmsEntries({
    type,
    status,
    q: params.q,
    page: params.page,
  });

  const base = cmsTypeRoutes[type];
  const label = cmsTypeLabels[type];

  return (
    <div className="space-y-6">
      <PageHeader
        title={label}
        description={`Draft, review, and publish ${label.toLowerCase()} entries.`}
        actions={<ButtonLink href={`${base}/new`}>New draft</ButtonLink>}
      />

      <ListFilters
        pathname={base}
        q={params.q}
        status={status}
        statusOptions={[
          { value: "all", label: "All" },
          { value: "draft", label: "Draft" },
          { value: "in_review", label: "In review" },
          { value: "published", label: "Published" },
          { value: "archived", label: "Archived" },
        ]}
      />

      <DataTable
        columns={[
          {
            key: "title",
            header: "Title",
            cell: (row) => (
              <Link
                href={`${base}/${row.id}`}
                className="font-medium underline-offset-2 hover:underline"
              >
                {row.title}
              </Link>
            ),
          },
          {
            key: "slug",
            header: "Slug",
            cell: (row) => (
              <span className="font-mono text-xs text-foreground-secondary">
                {row.slug}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => (
              <Badge tone={cmsStatusTone(row.status)}>{row.status}</Badge>
            ),
          },
          {
            key: "updated",
            header: "Updated",
            cell: (row) =>
              row.updatedAt.toLocaleDateString(undefined, { dateStyle: "medium" }),
          },
        ]}
        rows={result.rows}
        getRowId={(row) => row.id}
        empty={
          <EmptyState
            title={`No ${label.toLowerCase()} entries`}
            description="Create a draft, then move it through review before publishing."
            action={<ButtonLink href={`${base}/new`}>New draft</ButtonLink>}
          />
        }
      />

      <PaginationLinks
        pathname={base}
        page={result.page}
        total={result.total}
        pageSize={result.pageSize}
        query={{ q: params.q, status }}
      />
    </div>
  );
}
