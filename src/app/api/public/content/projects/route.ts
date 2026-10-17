import { NextResponse } from "next/server";
import { assertCmsContentToken } from "@/lib/cms/content-token";
import { clientIpFromRequest, rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { listPublishedPortfolioProjects } from "@/server/cms/queries";

/**
 * Read-only publish contract for the public portfolio.
 * Auth: Authorization: Bearer <CMS_CONTENT_TOKEN>
 * Returns only status=published portfolio projects.
 */
export async function GET(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = rateLimit({
    key: `cms-public:${ip}`,
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const auth = assertCmsContentToken(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const projects = await listPublishedPortfolioProjects();
    return NextResponse.json(
      {
        version: 1,
        generatedAt: new Date().toISOString(),
        source: "rurango-studio",
        projects,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    logger.error("Public CMS projects feed failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Feed unavailable" }, { status: 500 });
  }
}
