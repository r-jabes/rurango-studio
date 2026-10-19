import { NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { logger } from "@/lib/logger";

type Params = Promise<{ key: string[] }>;

/**
 * Public media for CMS covers and company logos under media/public/.
 * Other vault keys are not served here.
 */
export async function GET(
  _request: Request,
  context: { params: Params },
) {
  try {
    const { key: parts } = await context.params;
    const key = parts.map(decodeURIComponent).join("/");
    if (!key.startsWith("media/public/")) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const object = await getStorage().getObject(key);
    const contentType =
      object.contentType && object.contentType.startsWith("image/")
        ? object.contentType
        : guessImageType(key);

    return new NextResponse(new Uint8Array(object.body), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    logger.error("Public media fetch failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}

function guessImageType(key: string) {
  const lower = key.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}
