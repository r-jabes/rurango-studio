import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { cmsEntries } from "@/db/schema";
import type { CmsEntryStatus, CmsEntryType } from "@/lib/cms/meta";
import { toPublishedPortfolioProject } from "@/lib/cms/publish";
import {
  DEFAULT_PAGE_SIZE,
  pageOffset,
  parsePage,
} from "@/lib/pagination";

export async function listCmsEntries(input: {
  type?: CmsEntryType;
  status?: CmsEntryStatus | "all";
  q?: string;
  page?: string;
}) {
  const page = parsePage(input.page);
  const offset = pageOffset(page);
  const filters = [];

  if (input.type) filters.push(eq(cmsEntries.type, input.type));
  if (input.status && input.status !== "all") {
    filters.push(eq(cmsEntries.status, input.status));
  }
  if (input.q?.trim()) {
    const q = `%${input.q.trim()}%`;
    filters.push(or(ilike(cmsEntries.title, q), ilike(cmsEntries.slug, q))!);
  }

  const where = filters.length ? and(...filters) : undefined;

  const [rows, totalRow] = await Promise.all([
    db.query.cmsEntries.findMany({
      where,
      orderBy: [desc(cmsEntries.updatedAt)],
      limit: DEFAULT_PAGE_SIZE,
      offset,
      with: {
        creator: { columns: { name: true } },
        tagLinks: { with: { tag: true } },
      },
    }),
    db.select({ value: count() }).from(cmsEntries).where(where),
  ]);

  return {
    rows,
    total: totalRow[0]?.value ?? 0,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export async function getCmsEntry(id: string) {
  return db.query.cmsEntries.findFirst({
    where: eq(cmsEntries.id, id),
    with: {
      creator: { columns: { name: true, email: true } },
      tagLinks: { with: { tag: true } },
      publishEvents: {
        orderBy: (events, { desc: d }) => [d(events.createdAt)],
        limit: 20,
        with: { actor: { columns: { name: true } } },
      },
    },
  });
}

export async function listPublishedPortfolioProjects() {
  const rows = await db.query.cmsEntries.findMany({
    where: and(
      eq(cmsEntries.type, "portfolio_project"),
      eq(cmsEntries.status, "published"),
    ),
    orderBy: [desc(cmsEntries.publishedAt), desc(cmsEntries.updatedAt)],
  });

  return rows
    .map(toPublishedPortfolioProject)
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

export async function countCmsByStatus() {
  const rows = await db
    .select({
      status: cmsEntries.status,
      value: count(),
    })
    .from(cmsEntries)
    .groupBy(cmsEntries.status);

  return Object.fromEntries(rows.map((r) => [r.status, r.value])) as Partial<
    Record<CmsEntryStatus, number>
  >;
}
