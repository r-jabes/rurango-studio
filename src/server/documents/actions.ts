"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  clients,
  documentTagLinks,
  documentTags,
  documentVersions,
  documents,
  projects,
} from "@/db/schema";
import {
  fail,
  formDataToObject,
  ok,
  type ActionResult,
} from "@/lib/action-result";
import { recordActivity } from "@/lib/activity";
import { assertAllowedUpload } from "@/lib/documents/policy";
import {
  buildVaultObjectKey,
  checksumSha256,
  getStorage,
} from "@/lib/storage";
import { requireRole } from "@/lib/session";
import {
  documentMetaSchema,
  parseTagNames,
} from "@/lib/validation/documents";

function zodFail(error: {
  flatten: () => {
    fieldErrors: Record<string, string[] | undefined>;
    formErrors: string[];
  };
}): ActionResult<never> {
  const flat = error.flatten();
  return fail(flat.formErrors[0] ?? "Check the highlighted fields.", flat.fieldErrors);
}

async function syncTags(documentId: string, tagNames: string[]) {
  await db
    .delete(documentTagLinks)
    .where(eq(documentTagLinks.documentId, documentId));

  for (const name of tagNames) {
    const existing = await db.query.documentTags.findFirst({
      where: eq(documentTags.name, name),
    });
    const tagId =
      existing?.id ??
      (
        await db
          .insert(documentTags)
          .values({ name })
          .returning({ id: documentTags.id })
      )[0].id;

    await db.insert(documentTagLinks).values({ documentId, tagId });
  }
}

async function assertClientProject(input: {
  clientId?: string;
  projectId?: string;
}) {
  if (input.projectId) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, input.projectId),
    });
    if (!project) return fail("Project not found.");
    if (input.clientId && input.clientId !== project.clientId) {
      return fail("Selected project does not belong to that client.");
    }
    return ok({ clientId: project.clientId, projectId: project.id });
  }
  if (input.clientId) {
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, input.clientId),
    });
    if (!client) return fail("Client not found.");
  }
  return ok({
    clientId: input.clientId,
    projectId: input.projectId,
  });
}

export async function createDocumentAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole(["owner", "member"]);
  const meta = documentMetaSchema.safeParse(formDataToObject(formData));
  if (!meta.success) return zodFail(meta.error);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Choose a file to upload.");
  }

  try {
    assertAllowedUpload({
      mimeType: file.type || "application/octet-stream",
      byteSize: file.size,
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Invalid file.");
  }

  const relation = await assertClientProject({
    clientId: meta.data.clientId,
    projectId: meta.data.projectId,
  });
  if (!relation.ok) return relation;

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = buildVaultObjectKey(file.name);
  const storage = getStorage();
  await storage.putObject({
    key: storageKey,
    body: buffer,
    contentType: file.type || "application/octet-stream",
  });

  const [document] = await db
    .insert(documents)
    .values({
      title: meta.data.title,
      categoryId: meta.data.categoryId,
      clientId: relation.data?.clientId,
      projectId: relation.data?.projectId,
      createdBy: session.user.id,
      status: "active",
    })
    .returning({ id: documents.id });

  const [version] = await db
    .insert(documentVersions)
    .values({
      documentId: document.id,
      versionNumber: 1,
      storageKey,
      originalFilename: file.name,
      mimeType: file.type || "application/octet-stream",
      byteSize: file.size,
      checksum: checksumSha256(buffer),
      changeNote: meta.data.changeNote ?? "Initial upload",
      uploadedBy: session.user.id,
    })
    .returning({ id: documentVersions.id });

  await db
    .update(documents)
    .set({
      currentVersionId: version.id,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, document.id));

  await syncTags(document.id, parseTagNames(meta.data.tags));

  await recordActivity({
    actorUserId: session.user.id,
    clientId: relation.data?.clientId,
    projectId: relation.data?.projectId,
    type: "document.created",
    summary: `Uploaded document “${meta.data.title}”.`,
    metadata: { documentId: document.id },
  });

  revalidatePath("/documents");
  return ok({ id: document.id }, "Document uploaded.");
}

export async function uploadDocumentVersionAction(
  documentId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });
  if (!existing) return fail("Document not found.");
  if (existing.status === "archived") {
    return fail("Restore the document before uploading a new version.");
  }

  const changeNote =
    typeof formData.get("changeNote") === "string"
      ? String(formData.get("changeNote")).trim() || undefined
      : undefined;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Choose a file to upload.");
  }

  try {
    assertAllowedUpload({
      mimeType: file.type || "application/octet-stream",
      byteSize: file.size,
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Invalid file.");
  }

  const latest = await db
    .select({ value: max(documentVersions.versionNumber) })
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId));
  const nextVersion = (latest[0]?.value ?? 0) + 1;

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = buildVaultObjectKey(file.name);
  await getStorage().putObject({
    key: storageKey,
    body: buffer,
    contentType: file.type || "application/octet-stream",
  });

  const [version] = await db
    .insert(documentVersions)
    .values({
      documentId,
      versionNumber: nextVersion,
      storageKey,
      originalFilename: file.name,
      mimeType: file.type || "application/octet-stream",
      byteSize: file.size,
      checksum: checksumSha256(buffer),
      changeNote: changeNote ?? `Version ${nextVersion}`,
      uploadedBy: session.user.id,
    })
    .returning({ id: documentVersions.id });

  await db
    .update(documents)
    .set({
      currentVersionId: version.id,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId));

  await recordActivity({
    actorUserId: session.user.id,
    clientId: existing.clientId,
    projectId: existing.projectId,
    type: "document.version_uploaded",
    summary: `Uploaded version ${nextVersion} of “${existing.title}”.`,
    metadata: { documentId, versionId: version.id, versionNumber: nextVersion },
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  return ok(undefined, `Version ${nextVersion} uploaded. Previous versions are kept.`);
}

export async function updateDocumentMetaAction(
  documentId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });
  if (!existing) return fail("Document not found.");

  const meta = documentMetaSchema.safeParse(formDataToObject(formData));
  if (!meta.success) return zodFail(meta.error);

  const relation = await assertClientProject({
    clientId: meta.data.clientId,
    projectId: meta.data.projectId,
  });
  if (!relation.ok) return relation;

  await db
    .update(documents)
    .set({
      title: meta.data.title,
      categoryId: meta.data.categoryId ?? null,
      clientId: relation.data?.clientId ?? null,
      projectId: relation.data?.projectId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId));

  await syncTags(documentId, parseTagNames(meta.data.tags));

  await recordActivity({
    actorUserId: session.user.id,
    clientId: relation.data?.clientId,
    projectId: relation.data?.projectId,
    type: "document.updated",
    summary: `Updated document “${meta.data.title}”.`,
    metadata: { documentId },
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  return ok(undefined, "Document details saved.");
}

export async function archiveDocumentAction(
  documentId: string,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });
  if (!existing) return fail("Document not found.");

  await db
    .update(documents)
    .set({
      status: "archived",
      archivedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId));

  await recordActivity({
    actorUserId: session.user.id,
    clientId: existing.clientId,
    projectId: existing.projectId,
    type: "document.archived",
    summary: `Archived document “${existing.title}”.`,
    metadata: { documentId },
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  return ok(undefined, "Document archived. Files remain recoverable.");
}

export async function restoreDocumentAction(
  documentId: string,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });
  if (!existing) return fail("Document not found.");

  await db
    .update(documents)
    .set({
      status: "active",
      archivedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId));

  await recordActivity({
    actorUserId: session.user.id,
    clientId: existing.clientId,
    projectId: existing.projectId,
    type: "document.restored",
    summary: `Restored document “${existing.title}”.`,
    metadata: { documentId },
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  return ok(undefined, "Document restored.");
}

export async function setCurrentVersionAction(
  documentId: string,
  versionId: string,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });
  if (!existing) return fail("Document not found.");

  const version = await db.query.documentVersions.findFirst({
    where: and(
      eq(documentVersions.id, versionId),
      eq(documentVersions.documentId, documentId),
    ),
  });
  if (!version) return fail("Version not found.");

  await db
    .update(documents)
    .set({
      currentVersionId: version.id,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId));

  await recordActivity({
    actorUserId: session.user.id,
    clientId: existing.clientId,
    projectId: existing.projectId,
    type: "document.version_activated",
    summary: `Set version ${version.versionNumber} as current for “${existing.title}”.`,
    metadata: { documentId, versionId },
  });

  revalidatePath(`/documents/${documentId}`);
  return ok(undefined, "Current version updated.");
}
