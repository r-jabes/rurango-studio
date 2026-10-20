import { z } from "zod";

export const companySettingsInputSchema = z.object({
  legalName: z.string().trim().min(1).max(200),
  tradingName: z.string().trim().min(1).max(200),
  defaultCurrency: z
    .string()
    .trim()
    .length(3)
    .transform((v) => v.toUpperCase()),
  taxId: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  supportEmail: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim()))
    .refine(
      (v) => v === null || z.string().email().safeParse(v).success,
      "Support email must be valid.",
    ),
  addressLine1: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  addressLine2: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  addressCity: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  addressCountry: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  invoicePaymentDetails: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined) return null;
      const trimmed = v.trim();
      return trimmed === "" ? null : trimmed;
    })
    .refine(
      (v) => v === null || v.length <= 4000,
      "Payment instructions must be 4000 characters or fewer.",
    ),
  invoicePrefix: z.string().trim().min(1).max(12),
  quotationPrefix: z.string().trim().min(1).max(12),
  proposalPrefix: z.string().trim().min(1).max(12),
  agreementPrefix: z.string().trim().min(1).max(12),
  uploadMaxBytes: z
    .string()
    .trim()
    .transform((v) => Number(v))
    .refine(
      (v) => Number.isInteger(v) && v >= 1_048_576 && v <= 104_857_600,
      "Upload max must be between 1MB and 100MB.",
    ),
});

export const backupTriggerSchema = z.object({
  kind: z.enum(["db", "files", "full"]).default("full"),
});
