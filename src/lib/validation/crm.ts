import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.string().email("Enter a valid email.").optional(),
);
const optionalDate = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
    .optional(),
);
const optionalMinor = z.preprocess((value) => {
  const text = emptyToUndefined(value);
  if (!text) return undefined;
  if (!/^\d+$/.test(text)) return text;
  return Number(text);
}, z.number().int().nonnegative().optional());

export const clientStatusSchema = z.enum(["active", "archived"]);
export const projectStatusSchema = z.enum([
  "planned",
  "active",
  "on_hold",
  "completed",
  "archived",
]);
export const milestoneStatusSchema = z.enum([
  "planned",
  "in_progress",
  "done",
  "cancelled",
]);
export const taskStatusSchema = z.enum([
  "todo",
  "in_progress",
  "blocked",
  "done",
  "cancelled",
]);
export const taskPrioritySchema = z.enum(["low", "medium", "high"]);

export const clientInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(160),
  legalName: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  email: optionalEmail,
  phone: z.preprocess(emptyToUndefined, z.string().max(40).optional()),
  notes: z.preprocess(emptyToUndefined, z.string().max(5000).optional()),
});

export const projectInputSchema = z.object({
  clientId: z.string().uuid("Select a client."),
  name: z.string().trim().min(1, "Name is required.").max(160),
  code: z.preprocess(emptyToUndefined, z.string().max(40).optional()),
  description: z.preprocess(emptyToUndefined, z.string().max(5000).optional()),
  status: projectStatusSchema.default("planned"),
  startsOn: optionalDate,
  dueOn: optionalDate,
  budgetAmountMinor: optionalMinor,
  budgetCurrency: z.preprocess((value) => {
    const text = emptyToUndefined(value);
    return text ? text.toUpperCase() : "RWF";
  }, z.string().length(3)),
});

export const milestoneInputSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required.").max(160),
  description: z.preprocess(emptyToUndefined, z.string().max(2000).optional()),
  dueOn: optionalDate,
  status: milestoneStatusSchema.default("planned"),
  amountMinor: optionalMinor,
  sortOrder: z.coerce.number().int().min(0).default(0),
});

const optionalUuid = z.preprocess(
  emptyToUndefined,
  z.string().uuid().optional(),
);

export const taskInputSchema = z.object({
  projectId: z.string().uuid(),
  milestoneId: optionalUuid,
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.preprocess(emptyToUndefined, z.string().max(5000).optional()),
  status: taskStatusSchema.default("todo"),
  priority: taskPrioritySchema.default("medium"),
  dueOn: optionalDate,
});

export const noteInputSchema = z
  .object({
    clientId: optionalUuid,
    projectId: optionalUuid,
    body: z.string().trim().min(1, "Note cannot be empty.").max(8000),
  })
  .refine((value) => Boolean(value.clientId || value.projectId), {
    message: "Attach the note to a client or project.",
    path: ["body"],
  });

export type ClientInput = z.infer<typeof clientInputSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
