import { z } from "zod";

export const paymentInputSchema = z.object({
  invoiceId: z.string().uuid("Select an invoice."),
  amountMajor: z
    .string()
    .trim()
    .min(1, "Amount is required.")
    .refine((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0;
    }, "Amount must be a positive number."),
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((v) => v.toUpperCase()),
  paidOn: z.string().min(1, "Payment date is required."),
  method: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  reference: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  notes: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
});

export const deploymentInputSchema = z.object({
  projectId: z.string().uuid(),
  environment: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  url: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim()))
    .refine(
      (v) => v === null || /^https?:\/\//i.test(v),
      "URL must start with http:// or https://",
    ),
  notes: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  deployedAt: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
});

export const qaChecklistInputSchema = z.object({
  projectId: z.string().uuid(),
  milestoneId: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v))
    .pipe(z.string().uuid().nullable()),
  title: z.string().trim().min(1, "Checklist title is required.").max(200),
});

export const qaItemInputSchema = z.object({
  checklistId: z.string().uuid(),
  title: z.string().trim().min(1, "Item title is required.").max(300),
});

export const handoverInputSchema = z.object({
  projectId: z.string().uuid(),
  acceptedByName: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
  acceptedAt: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  notes: z
    .string()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v.trim())),
});
