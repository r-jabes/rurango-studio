import { CommercialListPage } from "@/components/commercial/commercial-list-page";

export const metadata = { title: "Quotations" };

export default function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  return <CommercialListPage type="quotation" searchParams={searchParams} />;
}
