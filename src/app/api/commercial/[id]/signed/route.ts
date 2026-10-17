import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { commercialDocuments } from "@/db/schema";
import { getSession } from "@/lib/session";
import { getStorage } from "@/lib/storage";
import { logger } from "@/lib/logger";

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
  const doc = await db.query.commercialDocuments.findFirst({
    where: eq(commercialDocuments.id, id),
  });
  if (!doc?.signedFileStorageKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const object = await getStorage().getObject(doc.signedFileStorageKey);
    const filename = (doc.signedFileFilename ?? "signed-copy").replaceAll(
      '"',
      "",
    );
    return new NextResponse(new Uint8Array(object.body), {
      status: 200,
      headers: {
        "Content-Type": doc.signedFileMimeType ?? "application/octet-stream",
        "Content-Length": String(object.body.byteLength),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    logger.error("Signed copy download failed", {
      documentId: id,
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
