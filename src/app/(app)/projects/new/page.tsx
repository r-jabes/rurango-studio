import Link from "next/link";
import { ProjectForm } from "@/components/crm/project-form";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";
import { requireRole } from "@/lib/session";
import { listActiveClientsForSelect } from "@/server/crm/queries";

type SearchParams = Promise<{ clientId?: string }>;

export const metadata = { title: "New project" };

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(["owner", "member"]);
  const params = await searchParams;
  const clients = await listActiveClientsForSelect();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New project"
        description="Link the project to an active client."
        actions={
          <ButtonLink href="/projects" variant="secondary">
            Back
          </ButtonLink>
        }
      />
      {clients.length === 0 ? (
        <StatusBanner tone="warning">
          Create an active client before adding a project.{" "}
          <Link href="/clients/new" className="underline">
            New client
          </Link>
        </StatusBanner>
      ) : (
        <ProjectForm
          mode="create"
          clients={clients}
          defaults={{ clientId: params.clientId }}
        />
      )}
    </div>
  );
}
