import Link from "next/link";
import { ListFilters } from "@/components/crm/list-filters";
import { PaginationLinks } from "@/components/crm/pagination-links";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";
import { formatBytes } from "@/lib/documents/policy";
import { requireRole } from "@/lib/session";
import { listDocumentCategories, listDocuments } from "@/server/documents/queries";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  categoryId?: string;
  tag?: string;
  page?: string;
}>;

export const metadata = { title: "Documents" };

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(["owner", "member"]);
  const params = await searchParams;
  const status =
    params.status === "archived" || params.status === "all"
      ? params.status
      : "active";

  const [categories, result] = await Promise.all([
    listDocumentCategories(),
    listDocuments({
      q: params.q,
      status,
      categoryId: params.categoryId,
      tag: params.tag,
      page: params.page,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Private vault. Files are stored outside public directories and downloaded only through authorized routes."
        actions={
          <ButtonLink href="/documents/new">Upload document</ButtonLink>
        }
      />

      <StatusBanner tone="info">
        Storage driver:{" "}
        <code className="font-mono text-accent">
          {process.env.STORAGE_DRIVER ?? "local"}
        </code>
        . Archiving hides documents but keeps versions for recovery. Hard delete
        is not available in this phase.
      </StatusBanner>

      <ListFilters
        pathname="/documents"
        q={params.q}
        status={status}
        statusOptions={[
          { value: "active", label: "Active" },
          { value: "archived", label: "Archived" },
          { value: "all", label: "All" },
        ]}
      />

      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-xs text-foreground-muted">
          <span>Categories:</span>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/documents?categoryId=${category.id}`}
              className="rounded-full border border-border px-2 py-0.5 hover:text-foreground"
            >
              {category.name}
            </Link>
          ))}
        </div>
      ) : null}

      <DataTable
        columns={[
          {
            key: "title",
            header: "Document",
            cell: (row) => (
              <Link
                href={`/documents/${row.id}`}
                className="font-medium underline-offset-2 hover:underline"
              >
                {row.title}
              </Link>
            ),
          },
          {
            key: "category",
            header: "Category",
            cell: (row) => row.categoryName ?? "—",
          },
          {
            key: "linked",
            header: "Linked",
            cell: (row) => row.clientName ?? row.projectName ?? "—",
          },
          {
            key: "file",
            header: "Current file",
            cell: (row) =>
              row.originalFilename
                ? `${row.originalFilename} · v${row.versionNumber} · ${formatBytes(row.byteSize ?? 0)}`
                : "—",
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => (
              <Badge tone={row.status === "active" ? "success" : "neutral"}>
                {row.status}
              </Badge>
            ),
          },
        ]}
        rows={result.rows}
        getRowId={(row) => row.id}
        empty={
          <EmptyState
            title="No documents yet"
            description="Upload the first private file to the vault."
            action={
              <ButtonLink href="/documents/new">Upload document</ButtonLink>
            }
          />
        }
      />

      <PaginationLinks
        pathname="/documents"
        page={result.page}
        total={result.total}
        pageSize={result.pageSize}
        query={{
          q: params.q,
          status,
          categoryId: params.categoryId,
          tag: params.tag,
        }}
      />
    </div>
  );
}
