import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { runBackup, type BackupKind } from "@/lib/backups/runner";
import { clientIpFromRequest, rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * Cron / automation entrypoint for backups.
 * Auth: x-backup-cron-secret must match BACKUP_CRON_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.BACKUP_CRON_SECRET?.trim();
  if (!secret || secret.length < 16) {
    return NextResponse.json(
      { error: "BACKUP_CRON_SECRET is not configured." },
      { status: 503 },
    );
  }

  const provided = request.headers.get("x-backup-cron-secret")?.trim() ?? "";
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = clientIpFromRequest(request);
  const limited = rateLimit({
    key: `backup-cron:${ip}`,
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many backup requests." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  let kind: BackupKind = "full";
  try {
    const body = (await request.json().catch(() => ({}))) as { kind?: string };
    if (body.kind === "db" || body.kind === "files" || body.kind === "full") {
      kind = body.kind;
    }
  } catch {
    // default full
  }

  try {
    const result = await runBackup({
      kind,
      triggeredBy: "cron",
    });

    await db.insert(auditLogs).values({
      action: result.ok ? "backup.cron.succeeded" : "backup.cron.failed",
      entityType: "backup_run",
      entityId: result.runId,
      metadataJson: {
        kind,
        destinationRef: result.ok ? result.destinationRef : undefined,
        error: result.ok ? undefined : result.error,
        ip,
      },
      ip,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, runId: result.runId },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      runId: result.runId,
      destinationRef: result.destinationRef,
    });
  } catch (error) {
    logger.error("Cron backup endpoint failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
