import { describe, expect, it } from "vitest";
import { cmsStatusTone, slugify } from "@/lib/cms/meta";

describe("slugify", () => {
  it("normalizes titles into URL-safe slugs", () => {
    expect(slugify("  Hello, Rurango!  ")).toBe("hello-rurango");
    expect(slugify("---")).toBe("");
  });

  it("truncates long slugs", () => {
    expect(slugify("a".repeat(100)).length).toBe(80);
  });
});

describe("cmsStatusTone", () => {
  it("maps statuses", () => {
    expect(cmsStatusTone("draft")).toBe("neutral");
    expect(cmsStatusTone("published")).toBe("success");
  });
});
