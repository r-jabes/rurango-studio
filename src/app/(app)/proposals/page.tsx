import { CommercialListPage } from "@/components/commercial/commercial-list-page";

export const metadata = { title: "Proposals" };

export default function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  return <CommercialListPage type="proposal" searchParams={searchParams} />;
}
