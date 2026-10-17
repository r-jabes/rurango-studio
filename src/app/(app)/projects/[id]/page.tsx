import { notFound } from "next/navigation";
import { ActivityTimeline } from "@/components/crm/activity-timeline";
import { ArchiveButton } from "@/components/crm/archive-button";
import { MilestoneForm } from "@/components/crm/milestone-form";
import { NoteForm } from "@/components/crm/note-form";
import { TaskForm } from "@/components/crm/task-form";
import { TaskStatusSelect } from "@/components/crm/task-status-select";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/session";
import { archiveProjectAction } from "@/server/crm/actions";
import { getProjectById, listActivities } from "@/server/crm/queries";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const project = await getProjectById(id);
  return { title: project?.name ?? "Project" };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Params;
}) {
  await requireRole(["owner", "member"]);
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  const activity = await listActivities({ projectId: id, limit: 30 });

  return (
    <div className="space-y-8">
      <PageHeader
        title={project.name}
        description={
          project.code
            ? `${project.code} · ${project.client.name}`
            : project.client.name
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/projects/${id}/edit`} variant="secondary">
              Edit
            </ButtonLink>
            <ButtonLink
              href={`/clients/${project.clientId}`}
              variant="secondary"
            >
              View client
            </ButtonLink>
            {project.status !== "archived" ? (
              <ArchiveButton
                label="Archive"
                confirmTitle="Archive this project?"
                confirmDescription="Archived projects are hidden from the default project list."
                action={() => archiveProjectAction(id)}
              />
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge>{project.status.replaceAll("_", " ")}</Badge>
        {project.dueOn ? <Badge tone="warning">Due {project.dueOn}</Badge> : null}
      </div>

      {project.description ? (
        <p className="max-w-3xl whitespace-pre-wrap text-sm text-foreground-secondary">
          {project.description}
        </p>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface/40 p-5">
          <h2 className="mb-4 text-sm font-medium">Milestones</h2>
          <MilestoneForm projectId={id} />
          <ul className="mt-6 space-y-3">
            {project.milestones.length === 0 ? (
              <li className="text-sm text-foreground-muted">No milestones yet.</li>
            ) : (
              project.milestones.map((milestone) => (
                <li
                  key={milestone.id}
                  className="flex items-start justify-between gap-3 border-t border-border pt-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{milestone.title}</p>
                    <p className="text-foreground-muted">
                      {milestone.dueOn ? `Due ${milestone.dueOn}` : "No due date"}
                    </p>
                  </div>
                  <Badge>{milestone.status.replaceAll("_", " ")}</Badge>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-surface/40 p-5">
          <h2 className="mb-4 text-sm font-medium">Tasks</h2>
          <TaskForm
            projectId={id}
            milestones={project.milestones.map((milestone) => ({
              id: milestone.id,
              title: milestone.title,
            }))}
          />
          <ul className="mt-6 space-y-3">
            {project.tasks.length === 0 ? (
              <li className="text-sm text-foreground-muted">No tasks yet.</li>
            ) : (
              project.tasks.map((task) => (
                <li
                  key={task.id}
                  className="grid gap-2 border-t border-border pt-3 text-sm sm:grid-cols-[1fr_10rem] sm:items-center"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-foreground-muted">
                      {task.priority} priority
                      {task.dueOn ? ` · due ${task.dueOn}` : ""}
                    </p>
                  </div>
                  <TaskStatusSelect taskId={task.id} value={task.status} />
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface/40 p-5">
          <h2 className="mb-4 text-sm font-medium">Notes</h2>
          <NoteForm projectId={id} />
          <ul className="mt-6 space-y-4">
            {project.notes.map((note) => (
              <li key={note.id} className="border-t border-border pt-4 text-sm">
                <p className="whitespace-pre-wrap">{note.body}</p>
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
