import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentActions } from "@/components/commercial/document-actions";
import { DeletePaymentButton } from "@/components/finance/delete-payment-button";
import { PaymentForm } from "@/components/finance/payment-form";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";
import {
  isEditableStatus,
  statusTone,
  typeLabels,
  typeRoutes,
  type PrimaryCommercialType,
} from "@/lib/commercial/meta";
import { balanceTone } from "@/lib/finance/balances";
import { formatMoney, minorToMajorString } from "@/lib/money";
import { getCommercialDocument } from "@/server/commercial/queries";
import { getInvoicePaymentSummary } from "@/server/finance/queries";

export async function CommercialDetailPage({
  type,
  id,
}: {
  type: PrimaryCommercialType;
  id: string;
}) {
  const doc = await getCommercialDocument(id);
  if (!doc || doc.type !== type) notFound();

  const base = typeRoutes[type];
  const snapshot = doc.snapshotJson;
  const paymentSummary =
    type === "invoice" ? await getInvoicePaymentSummary(id) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={doc.title}
        description={`${typeLabels[type]} ${doc.number}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {isEditableStatus(doc.status) ? (
              <ButtonLink href={`${base}/${doc.id}/edit`} variant="secondary">
                Edit draft
              </ButtonLink>
            ) : null}
            <ButtonLink href={base} variant="ghost">
              Back to list
            </ButtonLink>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={statusTone(doc.status)}>{doc.status}</Badge>
        <span className="text-sm text-foreground-secondary">
          {formatMoney(doc.totalMinor, doc.currency)}
        </span>
        {doc.issuedAt ? (
          <span className="text-sm text-foreground-secondary">
            Issued{" "}
            {doc.issuedAt.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        ) : null}
      </div>

      {doc.status !== "draft" && snapshot ? (
        <StatusBanner tone="info">
          Issued content is frozen in a snapshot. Editing the live draft fields
          is blocked; void and create a new document to reissue.
        </StatusBanner>
      ) : null}

      {doc.signedByName ? (
        <StatusBanner tone="success">
          Signed copy on file: {doc.signedByName}
          {doc.signedAt
            ? ` · ${doc.signedAt.toLocaleString(undefined, { dateStyle: "medium" })}`
            : ""}
          .{" "}
          <Link
            href={`/api/commercial/${doc.id}/signed`}
            className="underline underline-offset-2"
          >
            Download signed file
          </Link>
          . This records an uploaded artifact — not a legally binding e-signature.
        </StatusBanner>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-md border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground-secondary">
              Parties
            </h2>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-foreground-secondary">Client</dt>
                <dd>
                  <Link
                    href={`/clients/${doc.clientId}`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {doc.client.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-foreground-secondary">Project</dt>
                <dd>
                  {doc.project ? (
                    <Link
                      href={`/projects/${doc.project.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {doc.project.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-foreground-secondary">Issue date</dt>
                <dd>{doc.issueDate ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-foreground-secondary">Due / expiry</dt>
                <dd>
                  {doc.dueDate ?? "—"} / {doc.expiryDate ?? "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-foreground-secondary">Payment terms</dt>
                <dd>{doc.paymentTerms ?? "—"}</dd>
              </div>
              {doc.notes ? (
                <div className="sm:col-span-2">
                  <dt className="text-foreground-secondary">Notes</dt>
                  <dd className="whitespace-pre-wrap">{doc.notes}</dd>
                </div>
              ) : null}
              {doc.voidReason ? (
                <div className="sm:col-span-2">
                  <dt className="text-foreground-secondary">Void reason</dt>
                  <dd>{doc.voidReason}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-md border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground-secondary">
              Line items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-border text-foreground-secondary">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Description</th>
                    <th className="py-2 pr-3 font-medium">Qty</th>
                    <th className="py-2 pr-3 font-medium">Unit</th>
                    <th className="py-2 pr-3 font-medium">Tax %</th>
                    <th className="py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(snapshot?.lineItems ??
                    doc.lineItems.map((l) => ({
                      description: l.description,
                      quantity: l.quantity,
                      unitAmountMinor: l.unitAmountMinor,
                      taxRateBps: l.taxRateBps,
                      lineNetMinor: 0,
                      lineTaxMinor: 0,
                    }))).map((line, index) => {
                    const amount =
                      "lineNetMinor" in line &&
                      (line.lineNetMinor || line.lineTaxMinor)
                        ? line.lineNetMinor + line.lineTaxMinor
                        : null;
                    return (
                      <tr key={index} className="border-b border-border/60">
                        <td className="py-2 pr-3">{line.description}</td>
                        <td className="py-2 pr-3">{line.quantity}</td>
                        <td className="py-2 pr-3">
                          {minorToMajorString(line.unitAmountMinor)}
                        </td>
                        <td className="py-2 pr-3">
                          {(line.taxRateBps / 100).toFixed(1)}
                        </td>
                        <td className="py-2 text-right">
                          {amount !== null
                            ? formatMoney(amount, doc.currency)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-6 text-sm">
              <div>
                <span className="text-foreground-secondary">Subtotal </span>
                {formatMoney(doc.subtotalMinor, doc.currency)}
              </div>
              <div>
                <span className="text-foreground-secondary">Tax </span>
                {formatMoney(doc.taxMinor, doc.currency)}
              </div>
              <div className="font-semibold">
                Total {formatMoney(doc.totalMinor, doc.currency)}
              </div>
            </div>
          </section>
        </div>

        <DocumentActions
          documentId={doc.id}
          status={doc.status}
          type={doc.type}
          hasSignedCopy={Boolean(doc.signedFileStorageKey)}
        />
      </div>

      {paymentSummary ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-md border border-border bg-surface p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-secondary">
                Balance
              </h2>
              <Badge tone={balanceTone(paymentSummary.status)}>
                {paymentSummary.status}
              </Badge>
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-foreground-secondary">Invoice total</dt>
                <dd className="font-medium">
                  {formatMoney(doc.totalMinor, doc.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-foreground-secondary">Collected</dt>
                <dd className="font-medium">
                  {formatMoney(paymentSummary.paidMinor, doc.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-foreground-secondary">Outstanding</dt>
                <dd className="font-medium">
                  {formatMoney(paymentSummary.outstandingMinor, doc.currency)}
                </dd>
              </div>
            </dl>
            <ul className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              {paymentSummary.payments.length === 0 ? (
                <li className="text-foreground-muted">No payments recorded.</li>
              ) : (
                paymentSummary.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span>
                      {payment.paidOn} ·{" "}
                      {formatMoney(payment.amountMinor, payment.currency)}
                      {payment.method ? ` · ${payment.method}` : ""}
                    </span>
                    <DeletePaymentButton paymentId={payment.id} />
                  </li>
                ))
              )}
            </ul>
          </div>
          {doc.status !== "draft" && doc.status !== "void" ? (
            <div className="rounded-md border border-border bg-surface p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground-secondary">
                Record payment
              </h2>
              <PaymentForm
                defaultInvoiceId={doc.id}
                invoices={[
                  {
                    id: doc.id,
                    number: doc.number,
                    title: doc.title,
                    totalMinor: doc.totalMinor,
                    currency: doc.currency,
                    outstandingMinor: paymentSummary.outstandingMinor,
                    client: { name: doc.client.name },
                  },
                ]}
              />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
