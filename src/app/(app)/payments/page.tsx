import { SectionPlaceholder } from "@/components/sections/section-placeholder";

export const metadata = { title: "Payments" };

export default function PaymentsPage() {
  return (
    <SectionPlaceholder
      title="Payments"
      description="Manual payment recording against invoices."
      phaseNote="Partial payments, balances, and reports ship in Phase 5."
    />
  );
}
