import { CommercialEditPage } from "@/components/commercial/commercial-edit-page";

export const metadata = { title: "Edit proposal" };

type Params = Promise<{ id: string }>;

export default async function EditProposalPage({ params }: { params: Params }) {
  const { id } = await params;
  return <CommercialEditPage type="proposal" id={id} />;
}
