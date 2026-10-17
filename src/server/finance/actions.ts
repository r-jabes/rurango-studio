"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  commercialDocuments,
  deploymentRecords,
  handoverAcceptances,
  payments,
  projects,
  qaChecklists,
  qaItems,
} from "@/db/schema";
import {
  fail,
  formDataToObject,
  ok,
  type ActionResult,
} from "@/lib/action-result";
import { recordActivity } from "@/lib/activity";
import { assertAllowedUpload } from "@/lib/documents/policy";
import { majorToMinor } from "@/lib/money";
import { requireRole } from "@/lib/session";
import {
  buildVaultObjectKey,
  checksumSha256,
  getStorage,
} from "@/lib/storage";
import {
  deploymentInputSchema,
  handoverInputSchema,
  paymentInputSchema,
  qaChecklistInputSchema,
  qaItemInputSchema,
} from "@/lib/validation/finance";
import { sumPaymentsForInvoice } from "@/server/finance/queries";

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

export async function recordPaymentAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole(["owner", "member"]);
  const parsed = paymentInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  const invoice = await db.query.commercialDocuments.findFirst({
    where: eq(commercialDocuments.id, parsed.data.invoiceId),
  });
  if (!invoice || invoice.type !== "invoice") {
    return fail("Invoice not found.");
  }
  if (invoice.status === "draft" || invoice.status === "void") {
    return fail("Payments can only be recorded against issued invoices.");
  }
  if (parsed.data.currency !== invoice.currency) {
    return fail(`Payment currency must match the invoice (${invoice.currency}).`);
  }

  let amountMinor: number;
  try {
    amountMinor = majorToMinor(parsed.data.amountMajor);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Invalid amount.");
  }
  if (amountMinor <= 0) return fail("Amount must be greater than zero.");

  const [row] = await db
    .insert(payments)
    .values({
      invoiceId: invoice.id,
      amountMinor,
      currency: parsed.data.currency,
      paidOn: parsed.data.paidOn,
      method: parsed.data.method,
      reference: parsed.data.reference,
      notes: parsed.data.notes,
      recordedBy: session.user.id,
    })
    .returning({ id: payments.id });

  const paidMinor = await sumPaymentsForInvoice(invoice.id);

  await recordActivity({
    actorUserId: session.user.id,
    clientId: invoice.clientId,
    projectId: invoice.projectId,
    type: "payment.recorded",
    summary: `Recorded payment on invoice ${invoice.number}.`,
    metadata: {
      paymentId: row.id,
      invoiceId: invoice.id,
      amountMinor,
      paidMinor,
      outstandingMinor: invoice.totalMinor - paidMinor,
    },
  });

  revalidatePath("/payments");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath("/");
  return ok({ id: row.id }, "Payment recorded.");
}

export async function deletePaymentAction(
  paymentId: string,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const existing = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
    with: { invoice: true },
  });
  if (!existing) return fail("Payment not found.");

  await db.delete(payments).where(eq(payments.id, paymentId));

  await recordActivity({
    actorUserId: session.user.id,
    clientId: existing.invoice.clientId,
    projectId: existing.invoice.projectId,
    type: "payment.deleted",
    summary: `Removed payment from invoice ${existing.invoice.number}.`,
    metadata: {
      paymentId,
      invoiceId: existing.invoiceId,
      amountMinor: existing.amountMinor,
    },
  });

  revalidatePath("/payments");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${existing.invoiceId}`);
  revalidatePath("/");
  return ok(undefined, "Payment removed.");
}

export async function createDeploymentAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole(["owner", "member"]);
  const parsed = deploymentInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, parsed.data.projectId),
  });
  if (!project) return fail("Project not found.");

  const deployedAt = parsed.data.deployedAt
    ? new Date(parsed.data.deployedAt)
    : new Date();

  const [row] = await db
    .insert(deploymentRecords)
    .values({
      projectId: project.id,
      environment: parsed.data.environment,
      url: parsed.data.url,
      notes: parsed.data.notes,
      deployedAt,
      createdBy: session.user.id,
    })
    .returning({ id: deploymentRecords.id });

  await recordActivity({
    actorUserId: session.user.id,
    clientId: project.clientId,
    projectId: project.id,
    type: "deployment.recorded",
    summary: `Recorded deployment${parsed.data.environment ? ` (${parsed.data.environment})` : ""}.`,
    metadata: { deploymentId: row.id, url: parsed.data.url },
  });

  revalidatePath(`/projects/${project.id}`);
  return ok({ id: row.id }, "Deployment recorded.");
}

export async function createQaChecklistAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole(["owner", "member"]);
  const parsed = qaChecklistInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, parsed.data.projectId),
  });
  if (!project) return fail("Project not found.");

  const [row] = await db
    .insert(qaChecklists)
    .values({
      projectId: project.id,
      milestoneId: parsed.data.milestoneId,
      title: parsed.data.title,
    })
    .returning({ id: qaChecklists.id });

  await recordActivity({
    actorUserId: session.user.id,
    clientId: project.clientId,
    projectId: project.id,
    type: "qa.checklist_created",
    summary: `Created QA checklist “${parsed.data.title}”.`,
    metadata: { checklistId: row.id },
  });

  revalidatePath(`/projects/${project.id}`);
  return ok({ id: row.id }, "QA checklist created.");
}

export async function addQaItemAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireRole(["owner", "member"]);
  const parsed = qaItemInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  const checklist = await db.query.qaChecklists.findFirst({
    where: eq(qaChecklists.id, parsed.data.checklistId),
  });
  if (!checklist) return fail("Checklist not found.");

  const [row] = await db
    .insert(qaItems)
    .values({
      checklistId: checklist.id,
      title: parsed.data.title,
    })
    .returning({ id: qaItems.id });

  revalidatePath(`/projects/${checklist.projectId}`);
  return ok({ id: row.id }, "QA item added.");
}

export async function toggleQaItemAction(
  itemId: string,
): Promise<ActionResult> {
  await requireRole(["owner", "member"]);
  const item = await db.query.qaItems.findFirst({
    where: eq(qaItems.id, itemId),
    with: { checklist: true },
  });
  if (!item) return fail("QA item not found.");

  const nextDone = !item.isDone;
  await db
    .update(qaItems)
    .set({
      isDone: nextDone,
      doneAt: nextDone ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(qaItems.id, itemId));

  revalidatePath(`/projects/${item.checklist.projectId}`);
  return ok(undefined, nextDone ? "Marked done." : "Marked not done.");
}

export async function recordHandoverAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole(["owner", "member"]);
  const parsed = handoverInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, parsed.data.projectId),
  });
  if (!project) return fail("Project not found.");

  let fileStorageKey: string | null = null;
  let fileFilename: string | null = null;
  let fileMimeType: string | null = null;

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    try {
      assertAllowedUpload({ mimeType: file.type, byteSize: file.size });
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Invalid upload.");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = buildVaultObjectKey(file.name);
    await getStorage().putObject({
      key,
      body: buffer,
      contentType: file.type,
    });
    fileStorageKey = key;
    fileFilename = file.name;
    fileMimeType = file.type;

    await recordActivity({
      actorUserId: session.user.id,
      clientId: project.clientId,
      projectId: project.id,
      type: "handover.file_uploaded",
      summary: `Uploaded handover artifact for ${project.name}.`,
      metadata: { checksum: checksumSha256(buffer), filename: file.name },
    });
  }

  const acceptedAt = parsed.data.acceptedAt
    ? new Date(parsed.data.acceptedAt)
    : parsed.data.acceptedByName
      ? new Date()
      : null;

  const [row] = await db
    .insert(handoverAcceptances)
    .values({
      projectId: project.id,
      acceptedAt,
      acceptedByName: parsed.data.acceptedByName,
      notes: parsed.data.notes,
      fileStorageKey,
      fileFilename,
      fileMimeType,
      createdBy: session.user.id,
    })
    .returning({ id: handoverAcceptances.id });

  await recordActivity({
    actorUserId: session.user.id,
    clientId: project.clientId,
    projectId: project.id,
    type: "handover.recorded",
    summary: parsed.data.acceptedByName
      ? `Recorded handover acceptance by ${parsed.data.acceptedByName}.`
      : `Recorded handover note for ${project.name}.`,
    metadata: { handoverId: row.id },
  });

  revalidatePath(`/projects/${project.id}`);
  return ok({ id: row.id }, "Handover recorded.");
}
