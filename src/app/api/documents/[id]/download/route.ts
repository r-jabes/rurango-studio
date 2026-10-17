import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { documentVersions, documents } from "@/db/schema";
import { getStorage } from "@/lib/storage";
import { getSession } from "@/lib/session";
import { logger } from "@/lib/logger";

type Params = Promise<{ id: string }>;

export async function GET(
  request: Request,
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
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });
  if (!document || !document.currentVersionId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const versionId =
    new URL(request.url).searchParams.get("versionId") ??
    document.currentVersionId;

  const version = await db.query.documentVersions.findFirst({
    where: eq(documentVersions.id, versionId),
  });
  if (!version || version.documentId !== document.id) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  try {
    const object = await getStorage().getObject(version.storageKey);
    const disposition = new URL(request.url).searchParams.get("inline")
      ? "inline"
      : "attachment";

    return new NextResponse(new Uint8Array(object.body), {
      status: 200,
      headers: {
        "Content-Type": version.mimeType,
        "Content-Length": String(version.byteSize),
        "Content-Disposition": `${disposition}; filename="${version.originalFilename.replaceAll('"', "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    logger.error("Document download failed", {
      documentId: id,
      versionId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
