import { CommercialEditPage } from "@/components/commercial/commercial-edit-page";

export const metadata = { title: "Edit quotation" };

type Params = Promise<{ id: string }>;

export default async function EditQuotationPage({ params }: { params: Params }) {
  const { id } = await params;
  return <CommercialEditPage type="quotation" id={id} />;
}
