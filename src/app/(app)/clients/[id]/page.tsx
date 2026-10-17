import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityTimeline } from "@/components/crm/activity-timeline";
import { ArchiveButton } from "@/components/crm/archive-button";
import { NoteForm } from "@/components/crm/note-form";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/session";
import {
  archiveClientAction,
  restoreClientAction,
} from "@/server/crm/actions";
import {
  getClientById,
  listActivities,
  listClientNotes,
} from "@/server/crm/queries";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const client = await getClientById(id);
  return { title: client?.name ?? "Client" };
}

export default async function ClientDetailPage({
  params,
}: {
  params: Params;
}) {
  await requireRole(["owner", "member"]);
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const [activity, notes] = await Promise.all([
    listActivities({ clientId: id, limit: 25 }),
    listClientNotes(id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={client.name}
        description={client.legalName ?? "Client record"}
        actions={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/clients/${id}/edit`} variant="secondary">
              Edit
            </ButtonLink>
            <ButtonLink href={`/projects/new?clientId=${id}`} variant="secondary">
              New project
            </ButtonLink>
            {client.status === "active" ? (
              <ArchiveButton
                label="Archive"
                confirmTitle="Archive this client?"
                confirmDescription="Archived clients stay in the system but are hidden from the default list."
                action={() => archiveClientAction(id)}
              />
            ) : (
              <ArchiveButton
                label="Restore"
                confirmTitle="Restore this client?"
                confirmDescription="The client will return to the active list."
                action={() => restoreClientAction(id)}
              />
            )}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge tone={client.status === "active" ? "success" : "neutral"}>
          {client.status}
        </Badge>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface/40 p-5">
          <h2 className="mb-4 text-sm font-medium">Details</h2>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-foreground-muted">Email</dt>
              <dd>{client.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Phone</dt>
              <dd>{client.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Notes</dt>
              <dd className="whitespace-pre-wrap">{client.notes ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-surface/40 p-5">
          <h2 className="mb-4 text-sm font-medium">Projects</h2>
          {client.projects.length === 0 ? (
            <p className="text-sm text-foreground-muted">No projects yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {client.projects.map((project) => (
                <li key={project.id} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {project.name}
                  </Link>
                  <Badge>{project.status.replaceAll("_", " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface/40 p-5">
          <h2 className="mb-4 text-sm font-medium">Notes</h2>
          <NoteForm clientId={id} />
          <ul className="mt-6 space-y-4">
            {notes.map((note) => (
              <li key={note.id} className="border-t border-border pt-4 text-sm">
                <p className="whitespace-pre-wrap text-foreground">{note.body}</p>
                <p className="mt-2 text-xs text-foreground-muted">
                  {note.author?.name ?? "Unknown"} ·{" "}
                  {note.createdAt.toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-surface/40 p-5">
          <h2 className="mb-4 text-sm font-medium">Activity</h2>
          <ActivityTimeline items={activity} />
        </div>
      </section>
    </div>
  );
}
