"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  cmsEntries,
  cmsEntryTags,
  cmsPublishEvents,
  cmsTags,
  type CmsBodyJson,
  type PortfolioProjectBody,
  type PostBody,
  type ServiceBody,
  type TestimonialBody,
} from "@/db/schema";
import {
  fail,
  formDataToObject,
  ok,
  type ActionResult,
} from "@/lib/action-result";
import { cmsTypeRoutes, type CmsEntryType } from "@/lib/cms/meta";
import { requireRole } from "@/lib/session";
import {
  cmsEntryMetaSchema,
  cmsStatusSchema,
  portfolioProjectBodySchema,
  postBodySchema,
  serviceBodySchema,
  testimonialBodySchema,
} from "@/lib/validation/cms";

function zodFail(error: {
  flatten: () => {
    fieldErrors: unknown;
    formErrors: string[];
  };
}): ActionResult<never> {
  const flat = error.flatten();
  const fieldErrors =
    flat.fieldErrors &&
    typeof flat.fieldErrors === "object" &&
    !Array.isArray(flat.fieldErrors)
      ? (flat.fieldErrors as Record<string, string[] | undefined>)
      : undefined;
  return fail(flat.formErrors[0] ?? "Check the highlighted fields.", fieldErrors);
}

function revalidateCms(type: CmsEntryType, id?: string) {
  revalidatePath("/content");
  revalidatePath(cmsTypeRoutes[type]);
  if (id) revalidatePath(`${cmsTypeRoutes[type]}/${id}`);
}

async function syncTags(entryId: string, tagNames: string[]) {
  await db.delete(cmsEntryTags).where(eq(cmsEntryTags.entryId, entryId));
  for (const name of tagNames) {
    const existing = await db.query.cmsTags.findFirst({
      where: eq(cmsTags.name, name),
    });
    const tagId =
      existing?.id ??
      (
        await db
          .insert(cmsTags)
          .values({ name })
          .returning({ id: cmsTags.id })
      )[0]!.id;

    await db.insert(cmsEntryTags).values({ entryId, tagId }).onConflictDoNothing();
  }
}

function parseBody(
  type: CmsEntryType,
  form: Record<string, string>,
): ActionResult<CmsBodyJson> {
  if (type === "portfolio_project") {
    const parsed = portfolioProjectBodySchema.safeParse(form);
    if (!parsed.success) return zodFail(parsed.error);
    let decisions: PortfolioProjectBody["decisions"] = [];
    try {
      const raw = JSON.parse(parsed.data.decisionsJson);
      if (!Array.isArray(raw)) throw new Error("decisions must be an array");
      decisions = raw
        .filter(
          (item): item is { title: string; detail: string } =>
            item &&
            typeof item === "object" &&
            typeof item.title === "string" &&
            typeof item.detail === "string",
        )
        .map((item) => ({ title: item.title.trim(), detail: item.detail.trim() }))
        .filter((item) => item.title && item.detail);
    } catch {
      return fail("Decisions JSON is invalid. Use an array of { title, detail }.");
    }

    const body: PortfolioProjectBody = {
      summary: parsed.data.summary,
      projectType: parsed.data.projectType,
      projectStatus: parsed.data.projectStatus,
      year: parsed.data.year,
      role: parsed.data.role,
      audience: parsed.data.audience,
      liveUrl: parsed.data.liveUrl,
      previewImage: parsed.data.previewImage,
      featured: parsed.data.featured,
      context: parsed.data.context,
      problem: parsed.data.problem,
      approach: parsed.data.approach,
      implementation: parsed.data.implementation,
      notes: parsed.data.notes,
      scope: parsed.data.scopeText,
      constraints: parsed.data.constraintsText,
      technologies: parsed.data.technologiesText,
      outcomes: parsed.data.outcomesText,
      learnings: parsed.data.learningsText,
      capabilities: parsed.data.capabilitiesText,
      decisions,
    };
    return ok(body);
  }

  if (type === "service") {
    const parsed = serviceBodySchema.safeParse(form);
    if (!parsed.success) return zodFail(parsed.error);
    const body: ServiceBody = {
      description: parsed.data.description,
      problem: parsed.data.problem,
      deliverables: parsed.data.deliverablesText,
      relatedSlugs: parsed.data.relatedSlugsText,
    };
    return ok(body);
  }

  if (type === "post") {
    const parsed = postBodySchema.safeParse(form);
    if (!parsed.success) return zodFail(parsed.error);
    const body: PostBody = {
      excerpt: parsed.data.excerpt,
      markdown: parsed.data.markdown,
    };
    return ok(body);
  }

  const parsed = testimonialBodySchema.safeParse(form);
  if (!parsed.success) return zodFail(parsed.error);
  if (!parsed.data.clientApproved) {
    return fail(
      "Testimonials require explicit client approval before they can be saved for review.",
    );
  }
  const body: TestimonialBody = {
    quote: parsed.data.quote,
    attribution: parsed.data.attribution,
    roleOrCompany: parsed.data.roleOrCompany,
    clientApproved: true,
  };
  return ok(body);
}

export async function createCmsEntryAction(
  formData: FormData,
): Promise<ActionResult<{ id: string; type: CmsEntryType }>> {
  const session = await requireRole(["owner", "member"]);
  const form = formDataToObject(formData);
  const meta = cmsEntryMetaSchema.safeParse(form);
  if (!meta.success) return zodFail(meta.error);

  const bodyResult = parseBody(meta.data.type, form);
  if (!bodyResult.ok) return bodyResult;

  const duplicate = await db.query.cmsEntries.findFirst({
    where: and(
      eq(cmsEntries.type, meta.data.type),
      eq(cmsEntries.slug, meta.data.slug),
    ),
  });
  if (duplicate) return fail("An entry with this type and slug already exists.");

  const [row] = await db
    .insert(cmsEntries)
    .values({
      type: meta.data.type,
      slug: meta.data.slug,
      title: meta.data.title,
      status: "draft",
      bodyJson: bodyResult.data!,
      seoTitle: meta.data.seoTitle,
      seoDescription: meta.data.seoDescription,
      coverPublicPath: meta.data.coverPublicPath,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    })
    .returning({ id: cmsEntries.id });

  await syncTags(row.id, meta.data.tagsText);
  await db.insert(cmsPublishEvents).values({
    entryId: row.id,
    action: "created",
    actorUserId: session.user.id,
  });

  revalidateCms(meta.data.type, row.id);
  return ok({ id: row.id, type: meta.data.type }, "Draft created.");
}

export async function updateCmsEntryAction(
  entryId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.cmsEntries.findFirst({
    where: eq(cmsEntries.id, entryId),
  });
  if (!existing) return fail("Entry not found.");
  if (existing.status === "published") {
    return fail(
      "Published entries are locked. Unpublish or archive before editing content.",
    );
  }

  const form = formDataToObject(formData);
  const meta = cmsEntryMetaSchema.safeParse({ ...form, type: existing.type });
  if (!meta.success) return zodFail(meta.error);

  const bodyResult = parseBody(existing.type, form);
  if (!bodyResult.ok) return bodyResult;

  if (meta.data.slug !== existing.slug) {
    const duplicate = await db.query.cmsEntries.findFirst({
      where: and(
        eq(cmsEntries.type, existing.type),
        eq(cmsEntries.slug, meta.data.slug),
      ),
    });
    if (duplicate) return fail("An entry with this slug already exists.");
  }

  await db
    .update(cmsEntries)
    .set({
      slug: meta.data.slug,
      title: meta.data.title,
      bodyJson: bodyResult.data!,
      seoTitle: meta.data.seoTitle,
      seoDescription: meta.data.seoDescription,
      coverPublicPath: meta.data.coverPublicPath,
      updatedBy: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(cmsEntries.id, entryId));

  await syncTags(entryId, meta.data.tagsText);
  await db.insert(cmsPublishEvents).values({
    entryId,
    action: "updated",
    actorUserId: session.user.id,
  });

  revalidateCms(existing.type, entryId);
  return ok(undefined, "Draft updated.");
}

export async function setCmsStatusAction(
  entryId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.cmsEntries.findFirst({
    where: eq(cmsEntries.id, entryId),
  });
  if (!existing) return fail("Entry not found.");

  const parsed = cmsStatusSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  if (
    parsed.data.status === "published" &&
    existing.type === "testimonial"
  ) {
    const body = existing.bodyJson as { clientApproved?: boolean };
    if (!body.clientApproved) {
      return fail("Cannot publish a testimonial without client approval.");
    }
    return fail(
      "Testimonials are not published to the public site in Phase 6. Keep them in Studio only.",
    );
  }

  const publishedAt =
    parsed.data.status === "published"
      ? existing.publishedAt ?? new Date()
      : parsed.data.status === "draft" || parsed.data.status === "in_review"
        ? null
        : existing.publishedAt;

  await db
    .update(cmsEntries)
    .set({
      status: parsed.data.status,
      publishedAt,
      updatedBy: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(cmsEntries.id, entryId));

  await db.insert(cmsPublishEvents).values({
    entryId,
    action: `status:${parsed.data.status}`,
    actorUserId: session.user.id,
    note: parsed.data.note,
  });

  revalidateCms(existing.type, entryId);
  return ok(
    undefined,
    parsed.data.status === "published"
      ? "Published. Pull into the portfolio with web’s content:pull script when ready."
      : `Status set to ${parsed.data.status}.`,
  );
}
