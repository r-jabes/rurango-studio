import { desc } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, backupRuns } from "@/db/schema";

export async function getCompanySettings() {
  return db.query.companySettings.findFirst();
}

export async function listBackupRuns(limit = 30) {
  return db.query.backupRuns.findMany({
    orderBy: [desc(backupRuns.startedAt)],
    limit,
  });
}

export async function listRecentAuditLogs(limit = 40) {
  return db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
