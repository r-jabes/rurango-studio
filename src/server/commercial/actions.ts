"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  clients,
  commercialDocuments,
  commercialLineItems,
  companySettings,
  documentTemplates,
  projects,
  type CommercialSnapshot,
} from "@/db/schema";
import {
  fail,
  formDataToObject,
  ok,
  type ActionResult,
} from "@/lib/action-result";
import { recordActivity } from "@/lib/activity";
import {
  canIssue,
  canMarkResponse,
  canRecordSignedCopy,
  canVoid,
  isEditableStatus,
  isPrimaryCommercialType,
  typeRoutes,
  type PrimaryCommercialType,
} from "@/lib/commercial/meta";
import {
  ensureCompanySettings,
  nextDocumentNumber,
} from "@/lib/commercial/numbering";
import { renderCommercialPdf } from "@/lib/commercial/pdf";
import {
  assertAllowedUpload,
} from "@/lib/documents/policy";
import {
  buildVaultObjectKey,
  checksumSha256,
  getStorage,
} from "@/lib/storage";
import { calculateTotals, majorToMinor } from "@/lib/money";
import { requireRole } from "@/lib/session";
import {
  commercialDocumentInputSchema,
  lineItemsArraySchema,
  signedCopyMetaSchema,
  statusTransitionSchema,
  templateInputSchema,
  voidInputSchema,
} from "@/lib/validation/commercial";

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
      : { lineItemsJson: flat.formErrors.length ? flat.formErrors : ["Invalid line items."] };
  return fail(flat.formErrors[0] ?? "Check the highlighted fields.", fieldErrors);
}

function revalidateCommercial(type: PrimaryCommercialType, id?: string) {
  const base = typeRoutes[type];
  revalidatePath(base);
  if (id) revalidatePath(`${base}/${id}`);
  revalidatePath("/");
}

function parseLineItems(json: string) {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false as const, error: fail("Line items payload is invalid JSON.") };
  }
  const parsed = lineItemsArraySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: zodFail(parsed.error) };
  }
  return { ok: true as const, data: parsed.data };
}

function toStoredLines(
  lines: ReturnType<typeof lineItemsArraySchema.parse>,
) {
  const prepared = lines.map((line, index) => {
    const unitAmountMinor = majorToMinor(line.unitAmountMajor);
    const taxRateBps = Math.round(Number(line.taxRatePercent) * 100);
    return {
      description: line.description,
      quantity: line.quantity,
      unitAmountMinor,
      taxRateBps,
      sortOrder: index,
    };
  });
  const totals = calculateTotals(prepared);
  return { prepared, totals };
}

async function buildSnapshot(input: {
  documentId: string;
  issuedByUserId: string;
}): Promise<CommercialSnapshot> {
  const doc = await db.query.commercialDocuments.findFirst({
    where: eq(commercialDocuments.id, input.documentId),
    with: {
      client: true,
      project: true,
      lineItems: {
        orderBy: (items, { asc }) => [asc(items.sortOrder)],
      },
    },
  });
  if (!doc) throw new Error("Document not found for snapshot.");

  const settings =
    (await db.query.companySettings.findFirst()) ??
    (
      await db.insert(companySettings).values({}).returning()
    )[0];

  const lineInputs = doc.lineItems.map((l) => ({
    quantity: l.quantity,
    unitAmountMinor: l.unitAmountMinor,
    taxRateBps: l.taxRateBps,
  }));
  const totals = calculateTotals(lineInputs);

  return {
    issuedAt: new Date().toISOString(),
    issuedByUserId: input.issuedByUserId,
    company: {
      legalName: settings.legalName,
      tradingName: settings.tradingName,
      taxId: settings.taxId,
      supportEmail: settings.supportEmail,
      address: settings.addressJson ?? null,
      logoStorageKey: settings.logoStorageKey,
    },
    client: {
      id: doc.client.id,
      name: doc.client.name,
      legalName: doc.client.legalName,
      email: doc.client.email,
      phone: doc.client.phone,
    },
    project: doc.project
      ? {
          id: doc.project.id,
          name: doc.project.name,
          code: doc.project.code,
        }
      : null,
    document: {
      id: doc.id,
      type: doc.type,
      number: doc.number,
      title: doc.title,
      currency: doc.currency,
      issueDate: doc.issueDate,
      dueDate: doc.dueDate,
      expiryDate: doc.expiryDate,
      paymentTerms: doc.paymentTerms,
      notes: doc.notes,
      bodyHtml: doc.bodyHtml,
    },
    lineItems: doc.lineItems.map((l, i) => ({
      description: l.description,
      quantity: l.quantity,
      unitAmountMinor: l.unitAmountMinor,
      taxRateBps: l.taxRateBps,
      lineNetMinor: totals.lines[i]!.lineNetMinor,
      lineTaxMinor: totals.lines[i]!.lineTaxMinor,
      sortOrder: l.sortOrder,
    })),
    totals: {
      subtotalMinor: totals.subtotalMinor,
      taxMinor: totals.taxMinor,
      totalMinor: totals.totalMinor,
    },
  };
}

export async function createCommercialDocumentAction(
  formData: FormData,
): Promise<ActionResult<{ id: string; type: PrimaryCommercialType }>> {
  const session = await requireRole(["owner", "member"]);
  const parsed = commercialDocumentInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  const lineParsed = parseLineItems(parsed.data.lineItemsJson);
  if (!lineParsed.ok) return lineParsed.error;

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, parsed.data.clientId),
  });
  if (!client) return fail("Client not found.");

  if (parsed.data.projectId) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, parsed.data.projectId),
    });
    if (!project) return fail("Project not found.");
    if (project.clientId !== parsed.data.clientId) {
      return fail("Project does not belong to the selected client.");
    }
  }

  let prepared;
  let totals;
  try {
    ({ prepared, totals } = toStoredLines(lineParsed.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Invalid line amounts.");
  }

  const type = parsed.data.type;

  const created = await db.transaction(async (tx) => {
    await ensureCompanySettings(tx);
    const number = await nextDocumentNumber(tx, type);

    const [row] = await tx
      .insert(commercialDocuments)
      .values({
        type,
        number,
        title: parsed.data.title,
        clientId: parsed.data.clientId,
        projectId: parsed.data.projectId,
        templateId: parsed.data.templateId,
        status: "draft",
        currency: parsed.data.currency,
        issueDate: parsed.data.issueDate,
        dueDate: parsed.data.dueDate,
        expiryDate: parsed.data.expiryDate,
        paymentTerms: parsed.data.paymentTerms,
        notes: parsed.data.notes,
        bodyHtml: parsed.data.bodyHtml,
        subtotalMinor: totals.subtotalMinor,
        taxMinor: totals.taxMinor,
        totalMinor: totals.totalMinor,
        createdBy: session.user.id,
      })
      .returning({ id: commercialDocuments.id });

    if (prepared.length) {
      await tx.insert(commercialLineItems).values(
        prepared.map((line) => ({
          commercialDocumentId: row.id,
          ...line,
        })),
      );
    }

    return row;
  });

  await recordActivity({
    actorUserId: session.user.id,
    clientId: parsed.data.clientId,
    projectId: parsed.data.projectId,
    type: `commercial.${type}.created`,
    summary: `Created ${type} draft “${parsed.data.title}”.`,
    metadata: { commercialDocumentId: created.id },
  });

  revalidateCommercial(type, created.id);
  return ok({ id: created.id, type }, "Draft created.");
}

export async function updateCommercialDocumentAction(
  documentId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.commercialDocuments.findFirst({
    where: eq(commercialDocuments.id, documentId),
  });
  if (!existing) return fail("Document not found.");
  if (!isPrimaryCommercialType(existing.type)) {
    return fail("Unsupported document type.");
  }
  if (!isEditableStatus(existing.status)) {
    return fail(
      "Issued and signed commercial documents cannot be edited. Void and reissue instead.",
    );
  }

  const parsed = commercialDocumentInputSchema.safeParse({
    ...formDataToObject(formData),
    type: existing.type,
  });
  if (!parsed.success) return zodFail(parsed.error);

  const lineParsed = parseLineItems(parsed.data.lineItemsJson);
  if (!lineParsed.ok) return lineParsed.error;

  if (parsed.data.projectId) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, parsed.data.projectId),
    });
    if (!project) return fail("Project not found.");
    if (project.clientId !== parsed.data.clientId) {
      return fail("Project does not belong to the selected client.");
    }
  }

  let prepared;
  let totals;
  try {
    ({ prepared, totals } = toStoredLines(lineParsed.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Invalid line amounts.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(commercialDocuments)
      .set({
        title: parsed.data.title,
        clientId: parsed.data.clientId,
        projectId: parsed.data.projectId,
        templateId: parsed.data.templateId,
        currency: parsed.data.currency,
        issueDate: parsed.data.issueDate,
        dueDate: parsed.data.dueDate,
        expiryDate: parsed.data.expiryDate,
        paymentTerms: parsed.data.paymentTerms,
        notes: parsed.data.notes,
        bodyHtml: parsed.data.bodyHtml,
        subtotalMinor: totals.subtotalMinor,
        taxMinor: totals.taxMinor,
        totalMinor: totals.totalMinor,
        updatedAt: new Date(),
      })
      .where(eq(commercialDocuments.id, documentId));

    await tx
      .delete(commercialLineItems)
      .where(eq(commercialLineItems.commercialDocumentId, documentId));

    await tx.insert(commercialLineItems).values(
      prepared.map((line) => ({
        commercialDocumentId: documentId,
        ...line,
      })),
    );
  });

  await recordActivity({
    actorUserId: session.user.id,
    clientId: parsed.data.clientId,
    projectId: parsed.data.projectId,
    type: `commercial.${existing.type}.updated`,
    summary: `Updated ${existing.type} draft “${parsed.data.title}”.`,
    metadata: { commercialDocumentId: documentId },
  });

  revalidateCommercial(existing.type, documentId);
  return ok(undefined, "Draft updated.");
}

export async function issueCommercialDocumentAction(
  documentId: string,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.commercialDocuments.findFirst({
    where: eq(commercialDocuments.id, documentId),
    with: { lineItems: true },
  });
  if (!existing) return fail("Document not found.");
  if (!isPrimaryCommercialType(existing.type)) {
    return fail("Unsupported document type.");
  }
  if (!canIssue(existing.status)) {
    return fail("Only draft documents can be issued.");
  }
  if (!existing.lineItems.length) {
    return fail("Add at least one line item before issuing.");
  }

  const snapshot = await buildSnapshot({
    documentId,
    issuedByUserId: session.user.id,
  });

  const pdfBuffer = await renderCommercialPdf(snapshot);
  const storage = getStorage();
  const pdfKey = buildVaultObjectKey(`${existing.number}.pdf`);
  await storage.putObject({
    key: pdfKey,
    body: pdfBuffer,
    contentType: "application/pdf",
  });

  const issueDate =
    existing.issueDate ?? new Date().toISOString().slice(0, 10);

  await db
    .update(commercialDocuments)
    .set({
      status: "issued",
      issueDate,
      issuedAt: new Date(),
      snapshotJson: snapshot,
      pdfStorageKey: pdfKey,
      subtotalMinor: snapshot.totals.subtotalMinor,
      taxMinor: snapshot.totals.taxMinor,
      totalMinor: snapshot.totals.totalMinor,
      updatedAt: new Date(),
    })
    .where(eq(commercialDocuments.id, documentId));

  await recordActivity({
    actorUserId: session.user.id,
    clientId: existing.clientId,
    projectId: existing.projectId,
    type: `commercial.${existing.type}.issued`,
    summary: `Issued ${existing.type} ${existing.number}.`,
    metadata: {
      commercialDocumentId: documentId,
      pdfChecksum: checksumSha256(pdfBuffer),
    },
  });

  revalidateCommercial(existing.type, documentId);
  return ok(undefined, "Document issued. Snapshot and PDF are now frozen.");
}

export async function voidCommercialDocumentAction(
  documentId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.commercialDocuments.findFirst({
    where: eq(commercialDocuments.id, documentId),
  });
  if (!existing) return fail("Document not found.");
  if (!isPrimaryCommercialType(existing.type)) {
    return fail("Unsupported document type.");
  }
  if (!canVoid(existing.status)) {
    return fail("This document cannot be voided in its current status.");
  }

  const parsed = voidInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  await db
    .update(commercialDocuments)
    .set({
      status: "void",
      voidedAt: new Date(),
      voidReason: parsed.data.reason,
      updatedAt: new Date(),
    })
    .where(eq(commercialDocuments.id, documentId));

  await recordActivity({
    actorUserId: session.user.id,
    clientId: existing.clientId,
    projectId: existing.projectId,
    type: `commercial.${existing.type}.voided`,
    summary: `Voided ${existing.type} ${existing.number}.`,
    metadata: {
      commercialDocumentId: documentId,
      reason: parsed.data.reason,
    },
  });

  revalidateCommercial(existing.type, documentId);
  return ok(undefined, "Document voided. The issued snapshot remains intact.");
}

export async function markCommercialStatusAction(
  documentId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.commercialDocuments.findFirst({
    where: eq(commercialDocuments.id, documentId),
  });
  if (!existing) return fail("Document not found.");
  if (!isPrimaryCommercialType(existing.type)) {
    return fail("Unsupported document type.");
  }
  if (!canMarkResponse(existing.status)) {
    return fail("Only issued documents can be marked accepted or declined.");
  }

  const parsed = statusTransitionSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  await db
    .update(commercialDocuments)
    .set({
      status: parsed.data.status,
      updatedAt: new Date(),
    })
    .where(eq(commercialDocuments.id, documentId));

  await recordActivity({
    actorUserId: session.user.id,
    clientId: existing.clientId,
    projectId: existing.projectId,
    type: `commercial.${existing.type}.${parsed.data.status}`,
    summary: `Marked ${existing.type} ${existing.number} as ${parsed.data.status}.`,
    metadata: { commercialDocumentId: documentId },
  });

  revalidateCommercial(existing.type, documentId);
  return ok(undefined, `Marked as ${parsed.data.status}.`);
}

export async function uploadSignedCopyAction(
  documentId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.commercialDocuments.findFirst({
    where: eq(commercialDocuments.id, documentId),
  });
  if (!existing) return fail("Document not found.");
  if (!isPrimaryCommercialType(existing.type)) {
    return fail("Unsupported document type.");
  }
  if (existing.type !== "agreement") {
    return fail("Signed copies are recorded on agreements only.");
  }
  if (!canRecordSignedCopy(existing.status)) {
    return fail("Signed copies can only be recorded on issued or accepted agreements.");
  }

  const parsed = signedCopyMetaSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  if (existing.signedFileStorageKey && !parsed.data.replaceExisting) {
    return fail(
      "A signed copy is already on file. Confirm replacement to overwrite the file reference (audit logged).",
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Choose a signed copy file to upload.");
  }
  try {
    assertAllowedUpload({ mimeType: file.type, byteSize: file.size });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Invalid upload.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storage = getStorage();
  const key = buildVaultObjectKey(file.name);
  await storage.putObject({
    key,
    body: buffer,
    contentType: file.type,
  });

  const signedAt = parsed.data.signedAt
    ? new Date(parsed.data.signedAt)
    : new Date();

  await db
    .update(commercialDocuments)
    .set({
      signedFileStorageKey: key,
      signedFileFilename: file.name,
      signedFileMimeType: file.type,
      signedAt,
      signedByName: parsed.data.signedByName,
      signedNotes: parsed.data.signedNotes,
      updatedAt: new Date(),
    })
    .where(eq(commercialDocuments.id, documentId));

  await recordActivity({
    actorUserId: session.user.id,
    clientId: existing.clientId,
    projectId: existing.projectId,
    type: "commercial.agreement.signed_copy_recorded",
    summary: `Recorded signed copy metadata for ${existing.number} (not an e-signature).`,
    metadata: {
      commercialDocumentId: documentId,
      signedByName: parsed.data.signedByName,
      replaced: Boolean(existing.signedFileStorageKey),
      checksum: checksumSha256(buffer),
    },
  });

  revalidateCommercial("agreement", documentId);
  return ok(
    undefined,
    "Signed copy stored. This records an uploaded file and metadata — it is not a legally binding electronic signature.",
  );
}

export async function createTemplateAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireRole(["owner", "member"]);
  const parsed = templateInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  const [row] = await db
    .insert(documentTemplates)
    .values({
      type: parsed.data.type,
      name: parsed.data.name,
      bodyHtml: parsed.data.bodyHtml,
      defaultPaymentTerms: parsed.data.defaultPaymentTerms,
      defaultNotes: parsed.data.defaultNotes,
      isActive: parsed.data.isActive ?? true,
    })
    .returning({ id: documentTemplates.id });

  revalidatePath("/settings");
  return ok({ id: row.id }, "Template created.");
}

export async function updateTemplateAction(
  templateId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole(["owner", "member"]);
  const existing = await db.query.documentTemplates.findFirst({
    where: eq(documentTemplates.id, templateId),
  });
  if (!existing) return fail("Template not found.");

  const parsed = templateInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  await db
    .update(documentTemplates)
    .set({
      type: parsed.data.type,
      name: parsed.data.name,
      bodyHtml: parsed.data.bodyHtml,
      defaultPaymentTerms: parsed.data.defaultPaymentTerms,
      defaultNotes: parsed.data.defaultNotes,
      isActive: parsed.data.isActive ?? true,
      updatedAt: new Date(),
    })
    .where(eq(documentTemplates.id, templateId));

  revalidatePath("/settings");
  return ok(undefined, "Template updated.");
}

export async function deactivateTemplateAction(
  templateId: string,
): Promise<ActionResult> {
  await requireRole(["owner", "member"]);
  await db
    .update(documentTemplates)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(documentTemplates.id, templateId));
  revalidatePath("/settings");
  return ok(undefined, "Template deactivated.");
}
