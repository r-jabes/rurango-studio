import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import {
  clients,
  documentCategories,
  documentTagLinks,
  documentTags,
  documentVersions,
  documents,
  projects,
} from "@/db/schema";
import {
  DEFAULT_PAGE_SIZE,
  pageOffset,
  parsePage,
} from "@/lib/pagination";

export async function listDocumentCategories() {
  return db
    .select()
    .from(documentCategories)
    .orderBy(documentCategories.name);
}

export async function listDocuments(options: {
  q?: string;
  status?: "active" | "archived" | "all";
  categoryId?: string;
  clientId?: string;
  projectId?: string;
  tag?: string;
  page?: string;
}) {
  const page = parsePage(options.page);
  const status = options.status ?? "active";
  const q = options.q?.trim();
  const filters = [];

  if (status !== "all") {
    filters.push(eq(documents.status, status));
  }
  if (options.categoryId) {
    filters.push(eq(documents.categoryId, options.categoryId));
  }
  if (options.clientId) {
    filters.push(eq(documents.clientId, options.clientId));
  }
  if (options.projectId) {
    filters.push(eq(documents.projectId, options.projectId));
  }
  if (q) {
    filters.push(
      or(
        ilike(documents.title, `%${q}%`),
        ilike(documentVersions.originalFilename, `%${q}%`),
      ),
    );
  }

  let taggedDocumentIds: string[] | null = null;
  if (options.tag?.trim()) {
    const tag = await db.query.documentTags.findFirst({
      where: eq(documentTags.name, options.tag.trim().toLowerCase()),
    });
    if (!tag) {
      return { rows: [], total: 0, page, pageSize: DEFAULT_PAGE_SIZE };
    }
    const links = await db
      .select({ documentId: documentTagLinks.documentId })
      .from(documentTagLinks)
      .where(eq(documentTagLinks.tagId, tag.id));
    taggedDocumentIds = links.map((link) => link.documentId);
    if (taggedDocumentIds.length === 0) {
      return { rows: [], total: 0, page, pageSize: DEFAULT_PAGE_SIZE };
    }
    filters.push(inArray(documents.id, taggedDocumentIds));
  }

  const where = filters.length ? and(...filters) : undefined;

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: documents.id,
        title: documents.title,
        status: documents.status,
        updatedAt: documents.updatedAt,
        categoryName: documentCategories.name,
        clientName: clients.name,
        projectName: projects.name,
        mimeType: documentVersions.mimeType,
        byteSize: documentVersions.byteSize,
        originalFilename: documentVersions.originalFilename,
        versionNumber: documentVersions.versionNumber,
      })
      .from(documents)
      .leftJoin(
        documentCategories,
        eq(documents.categoryId, documentCategories.id),
      )
      .leftJoin(clients, eq(documents.clientId, clients.id))
      .leftJoin(projects, eq(documents.projectId, projects.id))
      .leftJoin(
        documentVersions,
        eq(documents.currentVersionId, documentVersions.id),
      )
      .where(where)
      .orderBy(desc(documents.updatedAt))
      .limit(DEFAULT_PAGE_SIZE)
      .offset(pageOffset(page)),
    db
      .select({ value: count() })
      .from(documents)
      .leftJoin(
        documentVersions,
        eq(documents.currentVersionId, documentVersions.id),
      )
      .where(where),
  ]);

  return {
    rows,
    total: totalRow[0]?.value ?? 0,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export async function getDocumentById(id: string) {
  return db.query.documents.findFirst({
    where: eq(documents.id, id),
    with: {
      category: true,
      client: true,
      project: true,
      creator: true,
      versions: {
        orderBy: (table, { desc: d }) => [d(table.versionNumber)],
        with: { uploader: true },
      },
      tagLinks: {
        with: { tag: true },
      },
    },
  });
}

export async function getDocumentVersion(documentId: string, versionId: string) {
  return db.query.documentVersions.findFirst({
    where: and(
      eq(documentVersions.id, versionId),
      eq(documentVersions.documentId, documentId),
    ),
  });
}
