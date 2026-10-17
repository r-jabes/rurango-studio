import { notFound } from "next/navigation";
import { ClientForm } from "@/components/crm/client-form";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/session";
import { getClientById } from "@/server/crm/queries";

type Params = Promise<{ id: string }>;

export const metadata = { title: "Edit client" };

export default async function EditClientPage({
  params,
}: {
  params: Params;
}) {
  await requireRole(["owner", "member"]);
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${client.name}`}
        description="Update client details."
        actions={
          <ButtonLink href={`/clients/${id}`} variant="secondary">
            Back
          </ButtonLink>
        }
      />
      <ClientForm
        mode="edit"
        clientId={id}
        defaults={{
          name: client.name,
          legalName: client.legalName,
          email: client.email,
          phone: client.phone,
          notes: client.notes,
        }}
      />
    </div>
  );
}
