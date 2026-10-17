import Link from "next/link";
import { PaginationLinks } from "@/components/crm/pagination-links";
import { DeletePaymentButton } from "@/components/finance/delete-payment-button";
import { PaymentForm } from "@/components/finance/payment-form";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { balanceTone } from "@/lib/finance/balances";
import { formatMoney } from "@/lib/money";
import { requireRole } from "@/lib/session";
import {
  getArSummary,
  listInvoiceBalances,
  listPayments,
} from "@/server/finance/queries";

type SearchParams = Promise<{ page?: string }>;

export const metadata = { title: "Payments" };

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(["owner", "member"]);
  const params = await searchParams;

  const [payments, balances, ar] = await Promise.all([
    listPayments({ page: params.page }),
    listInvoiceBalances(),
    getArSummary(),
  ]);

  const openBalances = balances.filter((b) => b.outstandingMinor > 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payments"
        description="Manual payment recording against issued invoices. Outstanding balance = invoice total − payments."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface/50 p-5">
          <p className="text-xs uppercase tracking-wide text-foreground-muted">
            Accounts receivable
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatMoney(ar.outstandingMinor, ar.currency)}
          </p>
          <p className="mt-1 text-xs text-foreground-secondary">
            {ar.openCount} open invoice{ar.openCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-5">
          <p className="text-xs uppercase tracking-wide text-foreground-muted">
            Collected (open invoices)
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatMoney(ar.collectedMinor, ar.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-5">
          <p className="text-xs uppercase tracking-wide text-foreground-muted">
            Issued invoices tracked
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {ar.invoiceCount}
          </p>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-border bg-surface/40 p-5">
          <h2 className="mb-4 text-sm font-medium">Record payment</h2>
          {balances.length === 0 ? (
            <EmptyState
              title="No payable invoices"
              description="Issue an invoice first, then record payments against it."
            />
          ) : (
            <PaymentForm
              invoices={balances.map((b) => ({
                id: b.id,
                number: b.number,
                title: b.title,
                totalMinor: b.totalMinor,
                currency: b.currency,
                outstandingMinor: b.outstandingMinor,
                client: b.client,
              }))}
            />
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface/40 p-5">
          <h2 className="mb-4 text-sm font-medium">Open balances</h2>
          {openBalances.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              No outstanding balances on issued invoices.
            </p>
          ) : (
            <ul className="space-y-3">
              {openBalances.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start justify-between gap-3 border-t border-border pt-3 text-sm first:border-t-0 first:pt-0"
                >
                  <div>
                    <Link
                      href={`/invoices/${row.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {row.number}
                    </Link>
                    <p className="text-foreground-muted">
                      {row.client?.name ?? "Client"} · {row.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={balanceTone(row.status)}>{row.status}</Badge>
                    <p className="mt-1 tabular-nums">
                      {formatMoney(row.outstandingMinor, row.currency)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Payment history</h2>
        <DataTable
          columns={[
            {
              key: "paidOn",
              header: "Paid on",
              cell: (row) => row.paidOn,
            },
            {
              key: "invoice",
              header: "Invoice",
              cell: (row) => (
                <Link
                  href={`/invoices/${row.invoiceId}`}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {row.invoice.number}
                </Link>
              ),
            },
            {
              key: "client",
              header: "Client",
              cell: (row) => row.invoice.client?.name ?? "—",
            },
            {
              key: "amount",
              header: "Amount",
              cell: (row) => formatMoney(row.amountMinor, row.currency),
            },
            {
              key: "method",
              header: "Method",
              cell: (row) => row.method ?? "—",
            },
            {
              key: "actions",
              header: "",
              cell: (row) => <DeletePaymentButton paymentId={row.id} />,
            },
          ]}
          rows={payments.rows}
          getRowId={(row) => row.id}
          empty={
            <EmptyState
              title="No payments yet"
              description="Record a payment against an issued invoice to build the ledger."
            />
          }
        />
        <PaginationLinks
          pathname="/payments"
          page={payments.page}
          total={payments.total}
          pageSize={payments.pageSize}
        />
      </section>
    </div>
  );
}
