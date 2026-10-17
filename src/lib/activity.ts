import { db } from "@/db";
import { activities, auditLogs } from "@/db/schema";

type RecordActivityInput = {
  actorUserId?: string | null;
  clientId?: string | null;
  projectId?: string | null;
  type: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function recordActivity(input: RecordActivityInput) {
  await db.insert(activities).values({
    actorUserId: input.actorUserId ?? null,
    clientId: input.clientId ?? null,
    projectId: input.projectId ?? null,
    type: input.type,
    summary: input.summary,
    metadataJson: input.metadata,
  });

  await db.insert(auditLogs).values({
    actorUserId: input.actorUserId ?? null,
    action: input.type,
    entityType: input.projectId
      ? "project"
      : input.clientId
        ? "client"
        : undefined,
    entityId: input.projectId ?? input.clientId ?? undefined,
    metadataJson: {
      summary: input.summary,
      ...(input.metadata ?? {}),
    },
  });
}
