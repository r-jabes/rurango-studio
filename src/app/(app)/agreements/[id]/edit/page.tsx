import { CommercialEditPage } from "@/components/commercial/commercial-edit-page";

export const metadata = { title: "Edit agreement" };

type Params = Promise<{ id: string }>;

export default async function EditAgreementPage({ params }: { params: Params }) {
  const { id } = await params;
  return <CommercialEditPage type="agreement" id={id} />;
}
