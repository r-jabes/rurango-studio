import { randomUUID } from "node:crypto";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  backupRuns,
  clients,
  cmsEntries,
  commercialDocuments,
  companySettings,
  documents,
  payments,
  projects,
} from "@/db/schema";
import { checksumSha256, getStorage } from "@/lib/storage";
import { logger } from "@/lib/logger";

export type BackupKind = "db" | "files" | "full";

function vaultRoot() {
  return (
    process.env.LOCAL_STORAGE_PATH?.trim() ||
    path.join(process.cwd(), ".data", "vault")
  );
}

async function collectFileInventory() {
  const root = vaultRoot();
  const files: Array<{ relative: string; bytes: number }> = [];

  async function walk(dir: string, prefix = "") {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(absolute, relative);
      } else if (entry.isFile()) {
        const info = await stat(absolute);
        files.push({ relative, bytes: info.size });
      }
    }
  }

  await walk(root);
  return {
    driver: process.env.STORAGE_DRIVER ?? "local",
    rootHint: process.env.STORAGE_DRIVER === "s3" ? "s3-bucket" : root,
    fileCount: files.length,
    totalBytes: files.reduce((sum, f) => sum + f.bytes, 0),
    files: files.slice(0, 5000),
  };
}

async function collectLogicalDbSnapshot() {
  const [
    settings,
    clientRows,
    projectRows,
    commercialRows,
    paymentRows,
    documentRows,
    cmsRows,
  ] = await Promise.all([
    db.select().from(companySettings),
    db.select().from(clients).limit(5000),
    db.select().from(projects).limit(5000),
    db.select().from(commercialDocuments).limit(5000),
    db.select().from(payments).limit(10000),
    db
      .select({
        id: documents.id,
        title: documents.title,
        status: documents.status,
        clientId: documents.clientId,
        projectId: documents.projectId,
        currentVersionId: documents.currentVersionId,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .limit(5000),
    db.select().from(cmsEntries).limit(5000),
  ]);

  return {
    version: 1,
    kind: "logical-db-snapshot",
    generatedAt: new Date().toISOString(),
    note:
      "Logical JSON snapshot for Studio recovery drills. Prefer provider PITR (e.g. Neon) for production database restore.",
    tables: {
      company_settings: settings,
      clients: clientRows,
      projects: projectRows,
      commercial_documents: commercialRows,
      payments: paymentRows,
      documents_metadata: documentRows,
      cms_entries: cmsRows,
    },
  };
}

export async function runBackup(input: {
  kind: BackupKind;
  triggeredBy: string;
}) {
  const [run] = await db
    .insert(backupRuns)
    .values({
      kind: input.kind,
      status: "running",
      triggeredBy: input.triggeredBy,
    })
    .returning();

  try {
    const payload: Record<string, unknown> = {
      runId: run.id,
      kind: input.kind,
      triggeredBy: input.triggeredBy,
      startedAt: new Date().toISOString(),
    };

    if (input.kind === "db" || input.kind === "full") {
      payload.database = await collectLogicalDbSnapshot();
    }
    if (input.kind === "files" || input.kind === "full") {
      payload.files = await collectFileInventory();
    }

    const body = Buffer.from(JSON.stringify(payload, null, 2), "utf8");
    const key = `backups/${new Date().toISOString().slice(0, 10)}/${run.id}-${input.kind}.json`;
    const storage = getStorage();
    await storage.putObject({
      key,
      body,
      contentType: "application/json",
    });

    const checksum = checksumSha256(body);
    await db
      .update(backupRuns)
      .set({
        status: "succeeded",
        destinationRef: key,
        byteSize: body.byteLength,
        checksum,
        finishedAt: new Date(),
        metadataJson: {
          storageDriver: process.env.STORAGE_DRIVER ?? "local",
          independentBucketConfigured: Boolean(process.env.BACKUP_S3_BUCKET),
          retentionDays: Number(process.env.BACKUP_RETENTION_DAYS ?? 30),
        },
      })
      .where(eq(backupRuns.id, run.id));

    logger.info("Backup succeeded", { runId: run.id, key, bytes: body.byteLength });
    return { ok: true as const, runId: run.id, destinationRef: key };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backup failed";
    await db
      .update(backupRuns)
      .set({
        status: "failed",
        errorMessage: message,
        finishedAt: new Date(),
      })
      .where(eq(backupRuns.id, run.id));
    logger.error("Backup failed", { runId: run.id, error: message });
    return { ok: false as const, runId: run.id, error: message };
  }
}

export function newBackupId() {
  return randomUUID();
}
