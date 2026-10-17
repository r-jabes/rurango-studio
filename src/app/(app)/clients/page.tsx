import Link from "next/link";
import { ListFilters } from "@/components/crm/list-filters";
import { PaginationLinks } from "@/components/crm/pagination-links";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/session";
import { listClients } from "@/server/crm/queries";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  page?: string;
}>;

export const metadata = { title: "Clients" };

export default async function ClientsPage({
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

  const result = await listClients({
    q: params.q,
    status,
    page: params.page,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Companies and contacts linked to projects and documents."
        actions={<ButtonLink href="/clients/new">New client</ButtonLink>}
      />

      <ListFilters
        pathname="/clients"
        q={params.q}
        status={status}
        statusOptions={[
          { value: "active", label: "Active" },
          { value: "archived", label: "Archived" },
          { value: "all", label: "All" },
        ]}
      />

      <DataTable
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (row) => (
              <Link
                href={`/clients/${row.id}`}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                {row.name}
              </Link>
            ),
          },
          {
            key: "email",
            header: "Email",
            cell: (row) => row.email ?? "—",
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
          {
            key: "updated",
            header: "Updated",
            cell: (row) =>
              row.updatedAt.toLocaleDateString(undefined, {
                dateStyle: "medium",
              }),
          },
        ]}
        rows={result.rows}
        getRowId={(row) => row.id}
        empty={
          <EmptyState
            title="No clients yet"
            description="Create a client to start linking projects, notes, and activity."
            action={<ButtonLink href="/clients/new">New client</ButtonLink>}
          />
        }
      />

      <PaginationLinks
        pathname="/clients"
        page={result.page}
        total={result.total}
        pageSize={result.pageSize}
        query={{ q: params.q, status }}
      />
    </div>
  );
}
