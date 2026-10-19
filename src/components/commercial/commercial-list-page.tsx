import Link from "next/link";
import { ListFilters } from "@/components/crm/list-filters";
import { PaginationLinks } from "@/components/crm/pagination-links";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";
import {
  isCoreCommercialType,
  statusTone,
  typeDescriptions,
  typeLabels,
  typePlurals,
  typeRoutes,
  type CommercialDocStatus,
  type PrimaryCommercialType,
} from "@/lib/commercial/meta";
import { formatMoney } from "@/lib/money";
import { requireRole } from "@/lib/session";
import { listCommercialDocuments } from "@/server/commercial/queries";

type SearchParams = {
  q?: string;
  status?: string;
  page?: string;
};

export async function CommercialListPage({
  type,
  searchParams,
}: {
  type: PrimaryCommercialType;
  searchParams: Promise<SearchParams>;
}) {
  await requireRole(["owner", "member"]);
  const params = await searchParams;
  const status =
    params.status &&
    [
      "draft",
      "issued",
      "accepted",
      "declined",
      "void",
      "superseded",
      "all",
    ].includes(params.status)
      ? (params.status as CommercialDocStatus | "all")
      : "all";

  const result = await listCommercialDocuments({
    type,
    q: params.q,
    status,
    page: params.page,
  });

  const base = typeRoutes[type];
  const plural = typePlurals[type];

  return (
    <div className="space-y-6">
      <PageHeader
        title={plural}
        description={typeDescriptions[type]}
        actions={
          <ButtonLink href={`${base}/new`}>New {typeLabels[type].toLowerCase()}</ButtonLink>
        }
      />

      {!isCoreCommercialType(type) ? (
        <StatusBanner tone="info">
          Default commercial path is{" "}
          <strong className="font-medium text-foreground">
            Quotation → Invoice → Payment
          </strong>
          . Use {typeLabels[type].toLowerCase()}s when that stage is genuinely
          needed; they remain fully supported.
        </StatusBanner>
      ) : type === "quotation" ? (
        <StatusBanner tone="info">
          Typical flow: create a quotation, issue it, then invoice when billing,
          and record receipts under Payments.
        </StatusBanner>
      ) : null}

      <ListFilters
        pathname={base}
        q={params.q}
        status={status}
        statusOptions={[
          { value: "all", label: "All" },
          { value: "draft", label: "Draft" },
          { value: "issued", label: "Issued" },
          { value: "accepted", label: "Accepted" },
          { value: "declined", label: "Declined" },
          { value: "void", label: "Void" },
        ]}
      />

      <DataTable
        columns={[
          {
            key: "number",
            header: "Number",
            cell: (row) => (
              <Link
                href={`${base}/${row.id}`}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                {row.number}
              </Link>
            ),
          },
          {
            key: "title",
            header: "Title",
            cell: (row) => row.title,
          },
          {
            key: "client",
            header: "Client",
            cell: (row) => row.client?.name ?? "—",
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => (
              <Badge tone={statusTone(row.status)}>{row.status}</Badge>
            ),
          },
          {
            key: "total",
            header: "Total",
            cell: (row) => formatMoney(row.totalMinor, row.currency),
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
            title={`No ${plural.toLowerCase()} yet`}
            description={`Create a ${typeLabels[type].toLowerCase()} draft linked to a client.`}
            action={
              <ButtonLink href={`${base}/new`}>
                New {typeLabels[type].toLowerCase()}
              </ButtonLink>
            }
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
