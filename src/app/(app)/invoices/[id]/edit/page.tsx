import { CommercialEditPage } from "@/components/commercial/commercial-edit-page";

export const metadata = { title: "Edit invoice" };

type Params = Promise<{ id: string }>;

export default async function EditInvoicePage({ params }: { params: Params }) {
  const { id } = await params;
  return <CommercialEditPage type="invoice" id={id} />;
}
