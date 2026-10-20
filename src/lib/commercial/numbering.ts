import { and, eq } from "drizzle-orm";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { randomBytes } from "node:crypto";
import * as schema from "@/db/schema";
import { commercialDocuments, companySettings } from "@/db/schema";
import {
  type PrimaryCommercialType,
  prefixFieldByType,
} from "@/lib/commercial/meta";

type Tx = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/** Ambiguity-safe alphabet (no 0/O, 1/I/L). */
const REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const REF_LENGTH = 8;
const MAX_ATTEMPTS = 12;

function opaqueReference(length = REF_LENGTH): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += REF_ALPHABET[bytes[i]! % REF_ALPHABET.length];
  }
  return out;
}

/**
 * Allocates a non-sequential document number: `{PREFIX}-{8 char ref}`.
 * Avoids year/serial formats that reveal how many documents have been issued.
 */
export async function nextDocumentNumber(
  tx: Tx,
  type: PrimaryCommercialType,
): Promise<string> {
  const settings = await tx.query.companySettings.findFirst();
  const prefixField = prefixFieldByType[type];
  const prefix =
    (settings?.[prefixField] as string | undefined)?.trim() ||
    defaultPrefix(type);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = `${prefix}-${opaqueReference()}`;
    const clash = await tx.query.commercialDocuments.findFirst({
      where: and(
        eq(commercialDocuments.type, type),
        eq(commercialDocuments.number, candidate),
      ),
      columns: { id: true },
    });
    if (!clash) return candidate;
  }

  throw new Error("Could not allocate a unique document number. Try again.");
}

function defaultPrefix(type: PrimaryCommercialType) {
  switch (type) {
    case "proposal":
      return "PRO";
    case "quotation":
      return "QUO";
    case "agreement":
      return "AGR";
    case "invoice":
      return "INV";
  }
}

export async function ensureCompanySettings(tx: Tx) {
  const existing = await tx.query.companySettings.findFirst();
  if (existing) return existing;
  const [row] = await tx.insert(companySettings).values({}).returning();
  return row;
}
