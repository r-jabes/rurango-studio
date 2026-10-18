import { and, count, desc, eq, ilike, isNull, ne, or } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  clients,
  milestones,
  notes,
  projects,
  tasks,
} from "@/db/schema";
import {
  DEFAULT_PAGE_SIZE,
  pageOffset,
  parsePage,
} from "@/lib/pagination";

export async function listClients(options: {
  q?: string;
  status?: "active" | "archived" | "all";
  page?: string;
}) {
  const page = parsePage(options.page);
  const status = options.status ?? "active";
  const q = options.q?.trim();

  const filters = [];
  if (status !== "all") {
    filters.push(eq(clients.status, status));
  }
  if (q) {
    filters.push(
      or(
        ilike(clients.name, `%${q}%`),
        ilike(clients.legalName, `%${q}%`),
        ilike(clients.email, `%${q}%`),
      ),
    );
  }

  const where = filters.length ? and(...filters) : undefined;

  const [rows, totalRow] = await Promise.all([
    db
      .select()
      .from(clients)
      .where(where)
      .orderBy(desc(clients.updatedAt))
      .limit(DEFAULT_PAGE_SIZE)
      .offset(pageOffset(page)),
    db.select({ value: count() }).from(clients).where(where),
  ]);

  return {
    rows,
    total: totalRow[0]?.value ?? 0,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export async function getClientById(id: string) {
  return db.query.clients.findFirst({
    where: eq(clients.id, id),
    with: {
      projects: {
        orderBy: (table, { desc: d }) => [d(table.updatedAt)],
      },
    },
  });
}

export async function listProjects(options: {
  q?: string;
  status?: string;
  clientId?: string;
  page?: string;
}) {
  const page = parsePage(options.page);
  const q = options.q?.trim();
  const filters = [];

  if (options.clientId) {
    filters.push(eq(projects.clientId, options.clientId));
  }
  // "active-ish" means not archived — never pass it to the Postgres enum.
  if (!options.status || options.status === "active-ish") {
    filters.push(ne(projects.status, "archived"));
  } else if (options.status !== "all") {
    filters.push(
      eq(
        projects.status,
        options.status as
          | "planned"
          | "active"
          | "on_hold"
          | "completed"
          | "archived",
      ),
    );
  }
  if (q) {
    filters.push(
      or(ilike(projects.name, `%${q}%`), ilike(projects.code, `%${q}%`)),
    );
  }

  const where = filters.length ? and(...filters) : undefined;

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        code: projects.code,
        status: projects.status,
        clientId: projects.clientId,
        clientName: clients.name,
        dueOn: projects.dueOn,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(where)
      .orderBy(desc(projects.updatedAt))
      .limit(DEFAULT_PAGE_SIZE)
      .offset(pageOffset(page)),
    db
      .select({ value: count() })
      .from(projects)
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(where),
  ]);

  return {
    rows,
    total: totalRow[0]?.value ?? 0,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export async function getProjectById(id: string) {
  return db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      client: true,
      milestones: {
        orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.createdAt)],
      },
      tasks: {
        orderBy: (table, { desc: d }) => [d(table.updatedAt)],
      },
      notes: {
        orderBy: (table, { desc: d }) => [d(table.createdAt)],
        with: { author: true },
      },
    },
  });
}

export async function listActiveClientsForSelect() {
  return db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.status, "active"))
    .orderBy(clients.name);
}

export async function listActivities(options: {
  clientId?: string;
  projectId?: string;
  limit?: number;
}) {
  const filters = [];
  if (options.clientId) filters.push(eq(activities.clientId, options.clientId));
  if (options.projectId) {
    filters.push(eq(activities.projectId, options.projectId));
  }
  const where = filters.length ? and(...filters) : undefined;

  return db
    .select()
    .from(activities)
    .where(where)
    .orderBy(desc(activities.createdAt))
    .limit(options.limit ?? 30);
}

export async function listClientNotes(clientId: string) {
  return db.query.notes.findMany({
    where: and(eq(notes.clientId, clientId), isNull(notes.projectId)),
    orderBy: (table, { desc: d }) => [d(table.createdAt)],
    with: { author: true },
  });
}

export async function getMilestoneById(id: string) {
  return db.query.milestones.findFirst({
    where: eq(milestones.id, id),
  });
}

export async function getTaskById(id: string) {
  return db.query.tasks.findFirst({
    where: eq(tasks.id, id),
  });
}
