"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLogs, companySettings } from "@/db/schema";
import {
  fail,
  formDataToObject,
  ok,
  type ActionResult,
} from "@/lib/action-result";
import { runBackup } from "@/lib/backups/runner";
import {
  IMAGE_UPLOAD_MIME_TYPES,
  assertAllowedUpload,
} from "@/lib/documents/policy";
import { requireRole } from "@/lib/session";
import {
  buildPublicMediaObjectKey,
  getStorage,
} from "@/lib/storage";
import {
  backupTriggerSchema,
  companySettingsInputSchema,
} from "@/lib/validation/settings";

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

export async function updateCompanySettingsAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(["owner", "member"]);
  const parsed = companySettingsInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  const addressJson: Record<string, string> = {};
  if (parsed.data.addressLine1) addressJson.line1 = parsed.data.addressLine1;
  if (parsed.data.addressLine2) addressJson.line2 = parsed.data.addressLine2;
  if (parsed.data.addressCity) addressJson.city = parsed.data.addressCity;
  if (parsed.data.addressCountry) addressJson.country = parsed.data.addressCountry;

  let logoStorageKey: string | null | undefined;
  const logoFile = formData.get("logoFile");
  if (logoFile instanceof File && logoFile.size > 0) {
    try {
      assertAllowedUpload({
        mimeType: logoFile.type,
        byteSize: logoFile.size,
        allowedMimeTypes: [...IMAGE_UPLOAD_MIME_TYPES],
      });
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Invalid logo file.");
    }
    const key = buildPublicMediaObjectKey(logoFile.name);
    await getStorage().putObject({
      key,
      body: Buffer.from(await logoFile.arrayBuffer()),
      contentType: logoFile.type,
    });
    logoStorageKey = key;
  } else if (formData.get("clearLogo") === "true") {
    logoStorageKey = null;
  }

  const existing = await db.query.companySettings.findFirst();
  if (existing) {
    await db
      .update(companySettings)
      .set({
        legalName: parsed.data.legalName,
        tradingName: parsed.data.tradingName,
        defaultCurrency: parsed.data.defaultCurrency,
        taxId: parsed.data.taxId,
        supportEmail: parsed.data.supportEmail,
        addressJson: Object.keys(addressJson).length ? addressJson : null,
        invoicePaymentDetails: parsed.data.invoicePaymentDetails,
        invoicePrefix: parsed.data.invoicePrefix,
        quotationPrefix: parsed.data.quotationPrefix,
        proposalPrefix: parsed.data.proposalPrefix,
        agreementPrefix: parsed.data.agreementPrefix,
        uploadMaxBytes: parsed.data.uploadMaxBytes,
        ...(logoStorageKey !== undefined ? { logoStorageKey } : {}),
        updatedAt: new Date(),
      })
      .where(eq(companySettings.id, existing.id));
  } else {
    await db.insert(companySettings).values({
      legalName: parsed.data.legalName,
      tradingName: parsed.data.tradingName,
      defaultCurrency: parsed.data.defaultCurrency,
      taxId: parsed.data.taxId,
      supportEmail: parsed.data.supportEmail,
      addressJson: Object.keys(addressJson).length ? addressJson : null,
      invoicePaymentDetails: parsed.data.invoicePaymentDetails,
      invoicePrefix: parsed.data.invoicePrefix,
      quotationPrefix: parsed.data.quotationPrefix,
      proposalPrefix: parsed.data.proposalPrefix,
      agreementPrefix: parsed.data.agreementPrefix,
      uploadMaxBytes: parsed.data.uploadMaxBytes,
      logoStorageKey: logoStorageKey ?? null,
    });
  }

  await db.insert(auditLogs).values({
    actorUserId: session.user.id,
    action: "settings.company.updated",
    entityType: "company_settings",
    metadataJson: {
      legalName: parsed.data.legalName,
      defaultCurrency: parsed.data.defaultCurrency,
    },
  });

  revalidatePath("/settings");
  return ok(undefined, "Company settings saved.");
}

export async function triggerBackupAction(
  formData: FormData,
): Promise<ActionResult<{ runId: string }>> {
  const session = await requireRole(["owner"]);
  const parsed = backupTriggerSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return zodFail(parsed.error);

  const result = await runBackup({
    kind: parsed.data.kind,
    triggeredBy: session.user.id,
  });

  await db.insert(auditLogs).values({
    actorUserId: session.user.id,
    action: result.ok ? "backup.succeeded" : "backup.failed",
    entityType: "backup_run",
    entityId: result.runId,
    metadataJson: {
      kind: parsed.data.kind,
      destinationRef: result.ok ? result.destinationRef : undefined,
      error: result.ok ? undefined : result.error,
    },
  });

  revalidatePath("/backups");
  if (!result.ok) {
    return fail(result.error ?? "Backup failed.");
  }
  return ok({ runId: result.runId }, "Backup completed.");
}
