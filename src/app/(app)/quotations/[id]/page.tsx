import { CommercialDetailPage } from "@/components/commercial/commercial-detail";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Quotation" };

type Params = Promise<{ id: string }>;

export default async function QuotationDetailPage({
  params,
}: {
  params: Params;
}) {
  await requireRole(["owner", "member"]);
  const { id } = await params;
  return <CommercialDetailPage type="quotation" id={id} />;
}
