import { CommercialListPage } from "@/components/commercial/commercial-list-page";

export const metadata = { title: "Agreements" };

export default function AgreementsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  return <CommercialListPage type="agreement" searchParams={searchParams} />;
}
