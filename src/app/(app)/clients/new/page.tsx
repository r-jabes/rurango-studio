import { ClientForm } from "@/components/crm/client-form";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/session";

export const metadata = { title: "New client" };

export default async function NewClientPage() {
  await requireRole(["owner", "member"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New client"
        description="Add a client record. Use real contact details you are allowed to store."
        actions={<ButtonLink href="/clients" variant="secondary">Back</ButtonLink>}
      />
      <ClientForm mode="create" />
    </div>
  );
}
