import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/crm/project-form";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/session";
import {
  getProjectById,
  listActiveClientsForSelect,
} from "@/server/crm/queries";

type Params = Promise<{ id: string }>;

export const metadata = { title: "Edit project" };

export default async function EditProjectPage({
  params,
}: {
  params: Params;
}) {
  await requireRole(["owner", "member"]);
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  const clients = await listActiveClientsForSelect();
  const clientOptions = clients.some((client) => client.id === project.clientId)
    ? clients
    : [{ id: project.clientId, name: project.client.name }, ...clients];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${project.name}`}
        description="Update project details and status."
        actions={
          <ButtonLink href={`/projects/${id}`} variant="secondary">
            Back
          </ButtonLink>
        }
      />
      <ProjectForm
        mode="edit"
        projectId={id}
        clients={clientOptions}
        defaults={{
          clientId: project.clientId,
          name: project.name,
          code: project.code,
          description: project.description,
          status: project.status,
          startsOn: project.startsOn,
          dueOn: project.dueOn,
          budgetAmountMinor: project.budgetAmountMinor,
          budgetCurrency: project.budgetCurrency,
        }}
      />
    </div>
  );
}
