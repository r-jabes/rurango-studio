import { SectionPlaceholder } from "@/components/sections/section-placeholder";

export const metadata = { title: "Invoices" };

export default function InvoicesPage() {
  return (
    <SectionPlaceholder
      title="Invoices"
      description="Issued invoices and outstanding balances."
      phaseNote="Invoice issuance and receivables tracking ship in Phases 4–5."
    />
  );
}
