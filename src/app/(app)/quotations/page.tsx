import { SectionPlaceholder } from "@/components/sections/section-placeholder";

export const metadata = { title: "Quotations" };

export default function QuotationsPage() {
  return (
    <SectionPlaceholder
      title="Quotations"
      description="Quotations with line items, tax, and expiry."
      phaseNote="Commercial document workflows ship in Phase 4."
    />
  );
}
