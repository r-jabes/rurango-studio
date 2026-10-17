import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { commercialDocuments } from "@/db/schema";
import { renderCommercialPdf } from "@/lib/commercial/pdf";
import { getSession } from "@/lib/session";
import { getStorage } from "@/lib/storage";
import { logger } from "@/lib/logger";

type Params = Promise<{ id: string }>;

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
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    let body: Buffer;

    if (doc.pdfStorageKey) {
      const object = await getStorage().getObject(doc.pdfStorageKey);
      body = object.body;
    } else if (doc.snapshotJson) {
      body = await renderCommercialPdf(doc.snapshotJson);
    } else {
      return NextResponse.json(
        { error: "PDF is available after the document is issued." },
        { status: 400 },
      );
    }

    const filename = `${doc.number}.pdf`.replaceAll('"', "");
    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(body.byteLength),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    logger.error("Commercial PDF download failed", {
      documentId: id,
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
