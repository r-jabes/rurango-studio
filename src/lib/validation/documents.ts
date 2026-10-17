import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

const optionalUuid = z.preprocess(
  emptyToUndefined,
  z.string().uuid().optional(),
);

export const documentMetaSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  categoryId: optionalUuid,
  clientId: optionalUuid,
  projectId: optionalUuid,
  tags: z.preprocess(emptyToUndefined, z.string().max(500).optional()),
  changeNote: z.preprocess(emptyToUndefined, z.string().max(500).optional()),
});

export type DocumentMetaInput = z.infer<typeof documentMetaSchema>;

export function parseTagNames(raw?: string) {
  if (!raw) return [] as string[];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of raw.split(",")) {
    const name = part.trim().toLowerCase();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    tags.push(name.slice(0, 40));
  }
  return tags.slice(0, 12);
}
