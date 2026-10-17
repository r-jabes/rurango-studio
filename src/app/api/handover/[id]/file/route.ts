import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { handoverAcceptances } from "@/db/schema";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/session";
import { getStorage } from "@/lib/storage";

type Params = Promise<{ id: string }>;

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Params },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role =
    (session.user as typeof session.user & { role?: string }).role ?? "owner";
  if (role === "client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const handover = await db.query.handoverAcceptances.findFirst({
    where: eq(handoverAcceptances.id, id),
  });
  if (!handover?.fileStorageKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const object = await getStorage().getObject(handover.fileStorageKey);
    const filename = (handover.fileFilename ?? "handover").replaceAll('"', "");
    return new NextResponse(new Uint8Array(object.body), {
      status: 200,
      headers: {
        "Content-Type": handover.fileMimeType ?? "application/octet-stream",
        "Content-Length": String(object.body.byteLength),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    logger.error("Handover file download failed", {
      handoverId: id,
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
