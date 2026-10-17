import { z } from "zod";
import { CMS_ENTRY_TYPES } from "@/lib/cms/meta";

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

const stringList = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  );

export const portfolioProjectBodySchema = z.object({
  summary: z.string().trim().min(1, "Summary is required.").max(500),
  projectType: z.enum(["product", "client", "internal", "personal", "concept"]),
  projectStatus: z.enum(["shipped", "in-progress", "soft-launch", "concept"]),
  year: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : Number(v)))
    .refine((v) => v === undefined || (Number.isInteger(v) && v >= 2000 && v <= 2100), {
      message: "Year must be a valid integer.",
    }),
  role: z.string().optional().transform((v) => (v === "" || v === undefined ? undefined : v.trim())),
  audience: z.string().optional().transform((v) => (v === "" || v === undefined ? undefined : v.trim())),
  liveUrl: z.string().trim().url("Live URL must be a valid URL."),
  previewImage: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v.trim())),
  featured: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "on" || v === "1"),
  context: z.string().optional().transform((v) => (v === "" || v === undefined ? undefined : v.trim())),
  problem: z.string().optional().transform((v) => (v === "" || v === undefined ? undefined : v.trim())),
  approach: z.string().optional().transform((v) => (v === "" || v === undefined ? undefined : v.trim())),
  implementation: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v.trim())),
  notes: z.string().optional().transform((v) => (v === "" || v === undefined ? undefined : v.trim())),
  scopeText: stringList,
  constraintsText: stringList,
  technologiesText: stringList,
  outcomesText: stringList,
  learningsText: stringList,
  capabilitiesText: stringList,
  decisionsJson: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? "[]" : v)),
});

export const serviceBodySchema = z.object({
  description: z.string().trim().min(1).max(500),
  problem: z.string().trim().min(1).max(800),
  deliverablesText: stringList,
  relatedSlugsText: stringList,
});

export const postBodySchema = z.object({
  excerpt: z.string().optional().transform((v) => (v === "" || v === undefined ? undefined : v.trim())),
  markdown: z.string().trim().min(1, "Post body is required."),
});

export const testimonialBodySchema = z.object({
  quote: z.string().trim().min(1).max(1000),
  attribution: z.string().trim().min(1).max(200),
  roleOrCompany: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v.trim())),
  clientApproved: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "on" || v === "1"),
});

export const cmsEntryMetaSchema = z.object({
  type: z.enum(CMS_ENTRY_TYPES),
  title: z.string().trim().min(1).max(200),
  slug: slugSchema,
  seoTitle: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  seoDescription: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  coverPublicPath: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  tagsText: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
});

export const cmsStatusSchema = z.object({
  status: z.enum(["draft", "in_review", "published", "archived"]),
  note: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
});
