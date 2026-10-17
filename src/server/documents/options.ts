import { desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { clients, projects } from "@/db/schema";

export async function listClientOptions() {
  return db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.status, "active"))
    .orderBy(clients.name);
}

export async function listProjectOptions() {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      clientId: projects.clientId,
    })
    .from(projects)
    .where(ne(projects.status, "archived"))
    .orderBy(desc(projects.updatedAt));
}
