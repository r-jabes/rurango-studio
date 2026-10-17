import { CommercialDetailPage } from "@/components/commercial/commercial-detail";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Invoice" };

type Params = Promise<{ id: string }>;

export default async function InvoiceDetailPage({
  params,
}: {
  params: Params;
}) {
  await requireRole(["owner", "member"]);
  const { id } = await params;
  return <CommercialDetailPage type="invoice" id={id} />;
}
