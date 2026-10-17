import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { commercialDocuments, documentTemplates } from "@/db/schema";
import type {
  CommercialDocStatus,
  PrimaryCommercialType,
} from "@/lib/commercial/meta";
import {
  DEFAULT_PAGE_SIZE,
  pageOffset,
  parsePage,
} from "@/lib/pagination";

export async function listCommercialDocuments(input: {
  type: PrimaryCommercialType;
  q?: string;
  status?: CommercialDocStatus | "all";
  page?: string;
}) {
  const page = parsePage(input.page);
  const offset = pageOffset(page);
  const status = input.status ?? "all";
  const q = input.q?.trim();

  const filters = [eq(commercialDocuments.type, input.type)];
  if (status !== "all") {
    filters.push(eq(commercialDocuments.status, status));
  }
  if (q) {
    filters.push(
      or(
        ilike(commercialDocuments.title, `%${q}%`),
        ilike(commercialDocuments.number, `%${q}%`),
      )!,
    );
  }

  const where = and(...filters);

  const [rows, totalRow] = await Promise.all([
    db.query.commercialDocuments.findMany({
      where,
      with: {
        client: { columns: { id: true, name: true } },
        project: { columns: { id: true, name: true } },
      },
      orderBy: [desc(commercialDocuments.updatedAt)],
      limit: DEFAULT_PAGE_SIZE,
      offset,
    }),
    db
      .select({ value: count() })
      .from(commercialDocuments)
      .where(where),
  ]);

  return {
    rows,
    total: totalRow[0]?.value ?? 0,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export async function getCommercialDocument(id: string) {
  return db.query.commercialDocuments.findFirst({
    where: eq(commercialDocuments.id, id),
    with: {
      client: true,
      project: true,
      template: true,
      lineItems: {
        orderBy: (items, { asc }) => [asc(items.sortOrder)],
      },
      creator: { columns: { id: true, name: true, email: true } },
    },
  });
}

export async function listTemplates(type?: PrimaryCommercialType) {
  if (type) {
    return db.query.documentTemplates.findMany({
      where: and(
        eq(documentTemplates.type, type),
        eq(documentTemplates.isActive, true),
      ),
      orderBy: [desc(documentTemplates.updatedAt)],
    });
  }
  return db.query.documentTemplates.findMany({
    orderBy: [desc(documentTemplates.updatedAt)],
  });
}

export async function listAllTemplates() {
  return db.query.documentTemplates.findMany({
    orderBy: [asc(documentTemplates.type), desc(documentTemplates.updatedAt)],
  });
}

export async function countCommercialByStatus(type: PrimaryCommercialType) {
  const rows = await db
    .select({
      status: commercialDocuments.status,
      value: count(),
    })
    .from(commercialDocuments)
    .where(eq(commercialDocuments.type, type))
    .groupBy(commercialDocuments.status);

  return Object.fromEntries(rows.map((r) => [r.status, r.value])) as Partial<
    Record<CommercialDocStatus, number>
  >;
}

export async function recentCommercialActivity(limit = 8) {
  return db.query.commercialDocuments.findMany({
    orderBy: [desc(commercialDocuments.updatedAt)],
    limit,
    with: {
      client: { columns: { name: true } },
    },
    columns: {
      id: true,
      type: true,
      number: true,
      title: true,
      status: true,
      totalMinor: true,
      currency: true,
      updatedAt: true,
    },
  });
}
