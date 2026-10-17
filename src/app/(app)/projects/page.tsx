import Link from "next/link";
import { ListFilters } from "@/components/crm/list-filters";
import { PaginationLinks } from "@/components/crm/pagination-links";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/session";
import { listProjects } from "@/server/crm/queries";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  page?: string;
}>;

export const metadata = { title: "Projects" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(["owner", "member"]);
  const params = await searchParams;
  const status = params.status || "active-ish";

  const result = await listProjects({
    q: params.q,
    status,
    page: params.page,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Engagements tied to clients, with milestones, tasks, and notes."
        actions={<ButtonLink href="/projects/new">New project</ButtonLink>}
      />

      <ListFilters
        pathname="/projects"
        q={params.q}
        status={status === "active-ish" ? "" : status}
        statusOptions={[
          { value: "", label: "Not archived" },
          { value: "planned", label: "Planned" },
          { value: "active", label: "Active" },
          { value: "on_hold", label: "On hold" },
          { value: "completed", label: "Completed" },
          { value: "archived", label: "Archived" },
          { value: "all", label: "All" },
        ]}
      />

      <DataTable
        columns={[
          {
            key: "name",
            header: "Project",
            cell: (row) => (
              <Link
                href={`/projects/${row.id}`}
                className="font-medium underline-offset-2 hover:underline"
              >
                {row.name}
              </Link>
            ),
          },
          {
            key: "client",
            header: "Client",
            cell: (row) => (
              <Link
                href={`/clients/${row.clientId}`}
                className="underline-offset-2 hover:underline"
              >
                {row.clientName}
              </Link>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => (
              <Badge>{row.status.replaceAll("_", " ")}</Badge>
            ),
          },
          {
            key: "due",
            header: "Due",
            cell: (row) => row.dueOn ?? "—",
          },
        ]}
        rows={result.rows}
        getRowId={(row) => row.id}
        empty={
          <EmptyState
            title="No projects yet"
            description="Create a project under an active client to track delivery work."
            action={<ButtonLink href="/projects/new">New project</ButtonLink>}
          />
        }
      />

      <PaginationLinks
        pathname="/projects"
        page={result.page}
        total={result.total}
        pageSize={result.pageSize}
        query={{
          q: params.q,
          status: status === "active-ish" ? undefined : status,
        }}
      />
    </div>
  );
}
