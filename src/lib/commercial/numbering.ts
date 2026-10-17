import { and, eq, sql } from "drizzle-orm";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { commercialNumberSequences, companySettings } from "@/db/schema";
import {
  type PrimaryCommercialType,
  prefixFieldByType,
} from "@/lib/commercial/meta";

type Tx = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export async function nextDocumentNumber(
  tx: Tx,
  type: PrimaryCommercialType,
): Promise<string> {
  const year = new Date().getFullYear();

  const existing = await tx.query.commercialNumberSequences.findFirst({
    where: and(
      eq(commercialNumberSequences.docType, type),
      eq(commercialNumberSequences.year, year),
    ),
  });

  let nextSeq: number;
  if (!existing) {
    await tx.insert(commercialNumberSequences).values({
      docType: type,
      year,
      lastSeq: 1,
    });
    nextSeq = 1;
  } else {
    const [updated] = await tx
      .update(commercialNumberSequences)
      .set({ lastSeq: sql`${commercialNumberSequences.lastSeq} + 1` })
      .where(
        and(
          eq(commercialNumberSequences.docType, type),
          eq(commercialNumberSequences.year, year),
        ),
      )
      .returning({ lastSeq: commercialNumberSequences.lastSeq });
    nextSeq = updated.lastSeq;
  }

  const settings = await tx.query.companySettings.findFirst();
  const prefixField = prefixFieldByType[type];
  const prefix =
    (settings?.[prefixField] as string | undefined)?.trim() ||
    defaultPrefix(type);

  return `${prefix}-${year}-${String(nextSeq).padStart(4, "0")}`;
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
