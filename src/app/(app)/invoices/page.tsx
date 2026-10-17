import { CommercialListPage } from "@/components/commercial/commercial-list-page";

export const metadata = { title: "Invoices" };

export default function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  return <CommercialListPage type="invoice" searchParams={searchParams} />;
}
