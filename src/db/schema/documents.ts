import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { clients, projects } from "./crm";

export const documentStatusEnum = pgEnum("document_status", [
  "active",
  "archived",
]);

export const documentCategories = pgTable("document_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  categoryId: uuid("category_id").references(() => documentCategories.id, {
    onDelete: "set null",
  }),
  clientId: uuid("client_id").references(() => clients.id, {
    onDelete: "set null",
  }),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  status: documentStatusEnum("status").default("active").notNull(),
  currentVersionId: uuid("current_version_id"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documentVersions = pgTable("document_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  storageKey: text("storage_key").notNull().unique(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  checksum: text("checksum"),
  changeNote: text("change_note"),
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documentTags = pgTable("document_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documentTagLinks = pgTable(
  "document_tag_links",
  {
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => documentTags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.documentId, table.tagId] })],
);

export const documentCategoriesRelations = relations(
  documentCategories,
  ({ many }) => ({
    documents: many(documents),
  }),
);

export const documentsRelations = relations(documents, ({ one, many }) => ({
  category: one(documentCategories, {
    fields: [documents.categoryId],
    references: [documentCategories.id],
  }),
  client: one(clients, {
    fields: [documents.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  creator: one(user, {
    fields: [documents.createdBy],
    references: [user.id],
  }),
  versions: many(documentVersions),
  tagLinks: many(documentTagLinks),
}));

export const documentVersionsRelations = relations(
  documentVersions,
  ({ one }) => ({
    document: one(documents, {
      fields: [documentVersions.documentId],
      references: [documents.id],
    }),
    uploader: one(user, {
      fields: [documentVersions.uploadedBy],
      references: [user.id],
    }),
  }),
);

export const documentTagsRelations = relations(documentTags, ({ many }) => ({
  links: many(documentTagLinks),
}));

export const documentTagLinksRelations = relations(
  documentTagLinks,
  ({ one }) => ({
    document: one(documents, {
      fields: [documentTagLinks.documentId],
      references: [documents.id],
    }),
    tag: one(documentTags, {
      fields: [documentTagLinks.tagId],
      references: [documentTags.id],
    }),
  }),
);
