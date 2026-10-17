import { z } from "zod";
import {
  COMMERCIAL_DOC_TYPES,
  PRIMARY_COMMERCIAL_TYPES,
} from "@/lib/commercial/meta";

const quantitySchema = z
  .string()
  .trim()
  .min(1, "Quantity is required.")
  .refine((v) => {
    try {
      const n = Number(v);
      return Number.isFinite(n) && n > 0;
    } catch {
      return false;
    }
  }, "Quantity must be a positive number.");

export const lineItemInputSchema = z.object({
  description: z.string().trim().min(1, "Line description is required.").max(500),
  quantity: quantitySchema,
  unitAmountMajor: z
    .string()
    .trim()
    .min(1, "Unit amount is required.")
    .refine((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0;
    }, "Unit amount must be a non-negative number."),
  taxRatePercent: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === undefined || v === "" ? "0" : v))
    .refine((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 && n <= 100;
    }, "Tax rate must be between 0 and 100."),
});

export const commercialDocumentInputSchema = z.object({
  type: z.enum(PRIMARY_COMMERCIAL_TYPES),
  title: z.string().trim().min(1, "Title is required.").max(200),
  clientId: z.string().uuid("Select a client."),
  projectId: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v))
    .pipe(z.string().uuid().nullable()),
  templateId: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v))
    .pipe(z.string().uuid().nullable()),
  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter code.")
    .transform((v) => v.toUpperCase()),
  issueDate: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  dueDate: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  expiryDate: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  paymentTerms: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  notes: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  bodyHtml: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  lineItemsJson: z.string().min(1, "Add at least one line item."),
});

export const lineItemsArraySchema = z
  .array(lineItemInputSchema)
  .min(1, "Add at least one line item.")
  .max(100);

export const templateInputSchema = z.object({
  type: z.enum(COMMERCIAL_DOC_TYPES),
  name: z.string().trim().min(1, "Name is required.").max(120),
  bodyHtml: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  defaultPaymentTerms: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  defaultNotes: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  isActive: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "on" || v === "1"),
});

export const voidInputSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Provide a short void reason.")
    .max(500),
});

export const signedCopyMetaSchema = z.object({
  signedByName: z.string().trim().min(1, "Signer name is required.").max(200),
  signedAt: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  signedNotes: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  replaceExisting: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "on" || v === "1"),
});

export const statusTransitionSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});
