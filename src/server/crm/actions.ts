"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  clients,
  milestones,
  notes,
  projects,
  tasks,
} from "@/db/schema";
import {
  fail,
  formDataToObject,
  ok,
  type ActionResult,
} from "@/lib/action-result";
import { recordActivity } from "@/lib/activity";
import { requireRole } from "@/lib/session";
import {
  clientInputSchema,
  milestoneInputSchema,
  noteInputSchema,
  projectInputSchema,
  taskInputSchema,
} from "@/lib/validation/crm";

function zodFail(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined>; formErrors: string[] };
}): ActionResult<never> {
  const flat = error.flatten();
  return fail(flat.formErrors[0] ?? "Check the highlighted fields.", flat.fieldErrors);
}

export async function createClientAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole(["owner", "member"]);
  const parsed = clientInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  const [row] = await db
    .insert(clients)
    .values({
      ...parsed.data,
      status: "active",
    })
    .returning({ id: clients.id, name: clients.name });

  await recordActivity({
    actorUserId: session.user.id,
    clientId: row.id,
    type: "client.created",
    summary: `Created client “${row.name}”.`,
  });

  revalidatePath("/clients");
  return ok({ id: row.id }, "Client created.");
}

export async function updateClientAction(
  clientId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });
  if (!existing) return fail("Client not found.", undefined);

  const parsed = clientInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  await db
    .update(clients)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, clientId));

  await recordActivity({
    actorUserId: session.user.id,
    clientId,
    type: "client.updated",
    summary: `Updated client “${parsed.data.name}”.`,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return ok(undefined, "Client updated.");
}

export async function archiveClientAction(
  clientId: string,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });
  if (!existing) return fail("Client not found.");

  await db
    .update(clients)
    .set({
      status: "archived",
      archivedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(clients.id, clientId));

  await recordActivity({
    actorUserId: session.user.id,
    clientId,
    type: "client.archived",
    summary: `Archived client “${existing.name}”.`,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return ok(undefined, "Client archived.");
}

export async function restoreClientAction(
  clientId: string,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });
  if (!existing) return fail("Client not found.");

  await db
    .update(clients)
    .set({
      status: "active",
      archivedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, clientId));

  await recordActivity({
    actorUserId: session.user.id,
    clientId,
    type: "client.restored",
    summary: `Restored client “${existing.name}”.`,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return ok(undefined, "Client restored.");
}

export async function createProjectAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole(["owner", "member"]);
  const parsed = projectInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, parsed.data.clientId),
  });
  if (!client || client.status === "archived") {
    return fail("Select an active client.");
  }

  const [row] = await db
    .insert(projects)
    .values({
      clientId: parsed.data.clientId,
      name: parsed.data.name,
      code: parsed.data.code,
      description: parsed.data.description,
      status: parsed.data.status,
      startsOn: parsed.data.startsOn,
      dueOn: parsed.data.dueOn,
      budgetAmountMinor: parsed.data.budgetAmountMinor,
      budgetCurrency: parsed.data.budgetCurrency ?? "RWF",
    })
    .returning({ id: projects.id, name: projects.name });

  await recordActivity({
    actorUserId: session.user.id,
    clientId: parsed.data.clientId,
    projectId: row.id,
    type: "project.created",
    summary: `Created project “${row.name}”.`,
  });

  revalidatePath("/projects");
  revalidatePath(`/clients/${parsed.data.clientId}`);
  return ok({ id: row.id }, "Project created.");
}

export async function updateProjectAction(
  projectId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
  if (!existing) return fail("Project not found.");

  const parsed = projectInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, parsed.data.clientId),
  });
  if (!client) return fail("Select a valid client.");

  await db
    .update(projects)
    .set({
      clientId: parsed.data.clientId,
      name: parsed.data.name,
      code: parsed.data.code,
      description: parsed.data.description,
      status: parsed.data.status,
      startsOn: parsed.data.startsOn ?? null,
      dueOn: parsed.data.dueOn ?? null,
      budgetAmountMinor: parsed.data.budgetAmountMinor ?? null,
      budgetCurrency: parsed.data.budgetCurrency ?? "RWF",
      archivedAt:
        parsed.data.status === "archived" ? existing.archivedAt ?? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  await recordActivity({
    actorUserId: session.user.id,
    clientId: parsed.data.clientId,
    projectId,
    type: "project.updated",
    summary: `Updated project “${parsed.data.name}”.`,
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${parsed.data.clientId}`);
  return ok(undefined, "Project updated.");
}

export async function archiveProjectAction(
  projectId: string,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
  if (!existing) return fail("Project not found.");

  await db
    .update(projects)
    .set({
      status: "archived",
      archivedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  await recordActivity({
    actorUserId: session.user.id,
    clientId: existing.clientId,
    projectId,
    type: "project.archived",
    summary: `Archived project “${existing.name}”.`,
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return ok(undefined, "Project archived.");
}

export async function createMilestoneAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const parsed = milestoneInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, parsed.data.projectId),
  });
  if (!project) return fail("Project not found.");

  const [row] = await db
    .insert(milestones)
    .values({
      projectId: parsed.data.projectId,
      title: parsed.data.title,
      description: parsed.data.description,
      dueOn: parsed.data.dueOn,
      status: parsed.data.status,
      amountMinor: parsed.data.amountMinor,
      sortOrder: parsed.data.sortOrder,
    })
    .returning({ id: milestones.id, title: milestones.title });

  await recordActivity({
    actorUserId: session.user.id,
    clientId: project.clientId,
    projectId: project.id,
    type: "milestone.created",
    summary: `Added milestone “${row.title}”.`,
    metadata: { milestoneId: row.id },
  });

  revalidatePath(`/projects/${project.id}`);
  return ok(undefined, "Milestone added.");
}

export async function createTaskAction(formData: FormData): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const parsed = taskInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, parsed.data.projectId),
  });
  if (!project) return fail("Project not found.");

  if (parsed.data.milestoneId) {
    const milestone = await db.query.milestones.findFirst({
      where: eq(milestones.id, parsed.data.milestoneId),
    });
    if (!milestone || milestone.projectId !== project.id) {
      return fail("Milestone does not belong to this project.");
    }
  }

  const [row] = await db
    .insert(tasks)
    .values({
      projectId: parsed.data.projectId,
      milestoneId: parsed.data.milestoneId,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      priority: parsed.data.priority,
      dueOn: parsed.data.dueOn,
    })
    .returning({ id: tasks.id, title: tasks.title });

  await recordActivity({
    actorUserId: session.user.id,
    clientId: project.clientId,
    projectId: project.id,
    type: "task.created",
    summary: `Added task “${row.title}”.`,
    metadata: { taskId: row.id },
  });

  revalidatePath(`/projects/${project.id}`);
  return ok(undefined, "Task added.");
}

export async function updateTaskStatusAction(
  taskId: string,
  status: string,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });
  if (!existing) return fail("Task not found.");

  const allowed = ["todo", "in_progress", "blocked", "done", "cancelled"] as const;
  if (!allowed.includes(status as (typeof allowed)[number])) {
    return fail("Invalid task status.");
  }

  await db
    .update(tasks)
    .set({
      status: status as (typeof allowed)[number],
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, existing.projectId),
  });

  await recordActivity({
    actorUserId: session.user.id,
    clientId: project?.clientId,
    projectId: existing.projectId,
    type: "task.status_changed",
    summary: `Marked task “${existing.title}” as ${status.replaceAll("_", " ")}.`,
    metadata: { taskId, status },
  });

  revalidatePath(`/projects/${existing.projectId}`);
  return ok(undefined, "Task updated.");
}

export async function createNoteAction(formData: FormData): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const parsed = noteInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  let clientId = parsed.data.clientId;
  const projectId = parsed.data.projectId;

  if (projectId) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });
    if (!project) return fail("Project not found.");
    clientId = project.clientId;
  } else if (clientId) {
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, clientId),
    });
    if (!client) return fail("Client not found.");
  }

  await db.insert(notes).values({
    clientId,
    projectId,
    authorUserId: session.user.id,
    body: parsed.data.body,
  });

  await recordActivity({
    actorUserId: session.user.id,
    clientId,
    projectId,
    type: "note.created",
    summary: "Added a note.",
  });

  if (projectId) revalidatePath(`/projects/${projectId}`);
  if (clientId) revalidatePath(`/clients/${clientId}`);
  return ok(undefined, "Note added.");
}
