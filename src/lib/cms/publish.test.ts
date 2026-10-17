import { describe, expect, it } from "vitest";
import type { cmsEntries } from "@/db/schema";
import {
  isPubliclyExportable,
  toPublishedPortfolioProject,
} from "@/lib/cms/publish";

type CmsEntryRow = typeof cmsEntries.$inferSelect;

function entry(partial: Partial<CmsEntryRow>): CmsEntryRow {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    type: "portfolio_project",
    slug: "demo",
    title: "Demo",
    status: "published",
    bodyJson: {
      summary: "A shipped product.",
      projectType: "product",
      projectStatus: "shipped",
      liveUrl: "https://example.com",
    },
    seoTitle: null,
    seoDescription: null,
    coverPublicPath: null,
    publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    createdBy: "user_1",
    updatedBy: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...partial,
  };
}

describe("isPubliclyExportable", () => {
  it("allows portfolio/service/post and blocks testimonials", () => {
    expect(isPubliclyExportable("portfolio_project")).toBe(true);
    expect(isPubliclyExportable("service")).toBe(true);
    expect(isPubliclyExportable("post")).toBe(true);
    expect(isPubliclyExportable("testimonial")).toBe(false);
  });
});

describe("toPublishedPortfolioProject", () => {
  it("maps published portfolio entries", () => {
    const published = toPublishedPortfolioProject(entry({}));
    expect(published).toMatchObject({
      title: "Demo",
      slug: "demo",
      summary: "A shipped product.",
      liveUrl: "https://example.com",
    });
  });

  it("returns null for drafts, wrong types, or incomplete bodies", () => {
    expect(
      toPublishedPortfolioProject(entry({ status: "draft" })),
    ).toBeNull();
    expect(
      toPublishedPortfolioProject(entry({ type: "testimonial" })),
    ).toBeNull();
    expect(
      toPublishedPortfolioProject(entry({ bodyJson: { summary: "only" } })),
    ).toBeNull();
  });
});
