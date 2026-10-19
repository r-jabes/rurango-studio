"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { FieldHint } from "@/components/ui/field-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBanner } from "@/components/ui/status-banner";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { formatMoney } from "@/lib/money";
import { recordPaymentAction } from "@/server/finance/actions";

type InvoiceOption = {
  id: string;
  number: string;
  title: string;
  totalMinor: number;
  currency: string;
  outstandingMinor?: number;
  client?: { name: string } | null;
};

type PaymentFormProps = {
  invoices: InvoiceOption[];
  defaultInvoiceId?: string;
};

export function PaymentForm({ invoices, defaultInvoiceId }: PaymentFormProps) {
  const { pending, fieldErrors, run } = useActionFeedback();
  const [invoiceId, setInvoiceId] = useState(defaultInvoiceId ?? "");

  const selected = useMemo(
    () => invoices.find((invoice) => invoice.id === invoiceId),
    [invoices, invoiceId],
  );

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (selected) formData.set("currency", selected.currency);

    run(() => recordPaymentAction(formData), {
      successTitle: "Payment recorded",
      onSuccess: () => {
        form.reset();
        setInvoiceId(defaultInvoiceId ?? "");
      },
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <StatusBanner tone="info">
        A payment is money received against an issued invoice — not a new
        commercial PDF. Create and issue the invoice first, then log each
        receipt here.
      </StatusBanner>

      <div>
        <Label htmlFor="invoiceId">Invoice</Label>
        <FieldHint>Which open invoice this receipt reduces.</FieldHint>
        <Select
          id="invoiceId"
          name="invoiceId"
          required
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
        >
          <option value="">Select invoice</option>
          {invoices.map((invoice) => (
            <option key={invoice.id} value={invoice.id}>
              {invoice.number} · {invoice.client?.name ?? "Client"} ·{" "}
              {formatMoney(invoice.totalMinor, invoice.currency)}
              {invoice.outstandingMinor !== undefined
                ? ` · due ${formatMoney(invoice.outstandingMinor, invoice.currency)}`
                : ""}
            </option>
          ))}
        </Select>
        <FieldError errors={fieldErrors.invoiceId} />
      </div>

      {selected ? (
        <p className="text-xs text-foreground-secondary">
          Invoice total {formatMoney(selected.totalMinor, selected.currency)}
          {selected.outstandingMinor !== undefined
            ? ` · outstanding ${formatMoney(selected.outstandingMinor, selected.currency)}`
            : ""}
          . Currency locked to {selected.currency}.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="amountMajor">Amount</Label>
          <FieldHint>Amount received in the invoice currency.</FieldHint>
          <Input
            id="amountMajor"
            name="amountMajor"
            required
            inputMode="decimal"
            placeholder="0.00"
          />
          <FieldError errors={fieldErrors.amountMajor} />
        </div>
        <div>
          <Label htmlFor="paidOn">Paid on</Label>
          <FieldHint>Bank / MoMo settlement date.</FieldHint>
          <Input
            id="paidOn"
            name="paidOn"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
          <FieldError errors={fieldErrors.paidOn} />
        </div>
        <div>
          <Label htmlFor="method">Method</Label>
          <FieldHint>e.g. Bank transfer, MTN MoMo, cash</FieldHint>
          <Input
            id="method"
            name="method"
            placeholder="Bank transfer, mobile money…"
          />
        </div>
        <div>
          <Label htmlFor="reference">Reference</Label>
          <FieldHint>Transaction ID or remittance number from the payer.</FieldHint>
          <Input id="reference" name="reference" placeholder="TXN-…" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <FieldHint>Optional context for finance review.</FieldHint>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
      </div>

      <input type="hidden" name="currency" value={selected?.currency ?? "RWF"} />

      <Button type="submit" loading={pending} disabled={!invoiceId}>
        {pending ? "Recording…" : "Record payment"}
      </Button>
    </form>
  );
}
