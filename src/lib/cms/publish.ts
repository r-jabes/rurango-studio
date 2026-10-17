import type { CmsBodyJson, PortfolioProjectBody, cmsEntries } from "@/db/schema";
import type { CmsEntryType } from "@/lib/cms/meta";

type CmsEntryRow = typeof cmsEntries.$inferSelect;

/** Public portfolio project shape consumed by `web/src/content`. */
export type PublishedPortfolioProject = {
  title: string;
  slug: string;
  summary: string;
  projectType: PortfolioProjectBody["projectType"];
  status: PortfolioProjectBody["projectStatus"];
  year?: number;
  role?: string;
  audience?: string;
  scope?: string[];
  constraints?: string[];
  technologies?: string[];
  liveUrl: string;
  previewImage?: string;
  featured?: boolean;
  context?: string;
  problem?: string;
  approach?: string;
  decisions?: Array<{ title: string; detail: string }>;
  implementation?: string;
  outcomes?: string[];
  learnings?: string[];
  capabilities?: string[];
  notes?: string;
};

function asPortfolioBody(body: CmsBodyJson): PortfolioProjectBody | null {
  if (!body || typeof body !== "object") return null;
  const candidate = body as Partial<PortfolioProjectBody>;
  if (!candidate.summary || !candidate.projectType || !candidate.projectStatus || !candidate.liveUrl) {
    return null;
  }
  return candidate as PortfolioProjectBody;
}

export function toPublishedPortfolioProject(
  entry: CmsEntryRow,
): PublishedPortfolioProject | null {
  if (entry.type !== "portfolio_project" || entry.status !== "published") {
    return null;
  }
  const body = asPortfolioBody(entry.bodyJson);
  if (!body) return null;

  return {
    title: entry.title,
    slug: entry.slug,
    summary: body.summary,
    projectType: body.projectType,
    status: body.projectStatus,
    year: body.year,
    role: body.role,
    audience: body.audience,
    scope: body.scope,
    constraints: body.constraints,
    technologies: body.technologies,
    liveUrl: body.liveUrl,
    previewImage: body.previewImage ?? entry.coverPublicPath ?? undefined,
    featured: body.featured,
    context: body.context,
    problem: body.problem,
    approach: body.approach,
    decisions: body.decisions,
    implementation: body.implementation,
    outcomes: body.outcomes,
    learnings: body.learnings,
    capabilities: body.capabilities,
    notes: body.notes,
  };
}

/**
 * Testimonials are never exposed on the public content API in Phase 6.
 * They require explicit client approval and a separate product decision.
 */
export function isPubliclyExportable(type: CmsEntryType) {
  return type === "portfolio_project" || type === "service" || type === "post";
}
