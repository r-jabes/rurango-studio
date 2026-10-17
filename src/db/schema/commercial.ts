import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { clients, projects } from "./crm";

export const commercialDocTypeEnum = pgEnum("commercial_doc_type", [
  "proposal",
  "quotation",
  "agreement",
  "invoice",
  "receipt",
  "handover",
]);

export const commercialDocStatusEnum = pgEnum("commercial_doc_status", [
  "draft",
  "issued",
  "accepted",
  "declined",
  "void",
  "superseded",
]);

export type CommercialSnapshot = {
  issuedAt: string;
  issuedByUserId: string;
  company: {
    legalName: string;
    tradingName: string;
    taxId: string | null;
    address: Record<string, string> | null;
  };
  client: {
    id: string;
    name: string;
    legalName: string | null;
    email: string | null;
    phone: string | null;
  };
  project: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  document: {
    id: string;
    type: string;
    number: string;
    title: string;
    currency: string;
    issueDate: string | null;
    dueDate: string | null;
    expiryDate: string | null;
    paymentTerms: string | null;
    notes: string | null;
    bodyHtml: string | null;
  };
  lineItems: Array<{
    description: string;
    quantity: string;
    unitAmountMinor: number;
    taxRateBps: number;
    lineNetMinor: number;
    lineTaxMinor: number;
    sortOrder: number;
  }>;
  totals: {
    subtotalMinor: number;
    taxMinor: number;
    totalMinor: number;
  };
};

export const documentTemplates = pgTable("document_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: commercialDocTypeEnum("type").notNull(),
  name: text("name").notNull(),
  bodyHtml: text("body_html"),
  defaultPaymentTerms: text("default_payment_terms"),
  defaultNotes: text("default_notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const commercialNumberSequences = pgTable(
  "commercial_number_sequences",
  {
    docType: commercialDocTypeEnum("doc_type").notNull(),
    year: integer("year").notNull(),
    lastSeq: integer("last_seq").default(0).notNull(),
  },
  (table) => [unique().on(table.docType, table.year)],
);

export const commercialDocuments = pgTable(
  "commercial_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: commercialDocTypeEnum("type").notNull(),
    number: text("number").notNull(),
    title: text("title").notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    templateId: uuid("template_id").references(() => documentTemplates.id, {
      onDelete: "set null",
    }),
    status: commercialDocStatusEnum("status").default("draft").notNull(),
    currency: text("currency").notNull().default("RWF"),
    issueDate: date("issue_date"),
    dueDate: date("due_date"),
    expiryDate: date("expiry_date"),
    paymentTerms: text("payment_terms"),
    notes: text("notes"),
    bodyHtml: text("body_html"),
    subtotalMinor: integer("subtotal_minor").default(0).notNull(),
    taxMinor: integer("tax_minor").default(0).notNull(),
    totalMinor: integer("total_minor").default(0).notNull(),
    snapshotJson: jsonb("snapshot_json").$type<CommercialSnapshot>(),
    pdfStorageKey: text("pdf_storage_key"),
    signedFileStorageKey: text("signed_file_storage_key"),
    signedFileFilename: text("signed_file_filename"),
    signedFileMimeType: text("signed_file_mime_type"),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    signedByName: text("signed_by_name"),
    signedNotes: text("signed_notes"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidReason: text("void_reason"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique().on(table.type, table.number)],
);

export const commercialLineItems = pgTable("commercial_line_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  commercialDocumentId: uuid("commercial_document_id")
    .notNull()
    .references(() => commercialDocuments.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: text("quantity").notNull().default("1"),
  unitAmountMinor: integer("unit_amount_minor").notNull().default(0),
  taxRateBps: integer("tax_rate_bps").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documentTemplatesRelations = relations(
  documentTemplates,
  ({ many }) => ({
    documents: many(commercialDocuments),
  }),
);

export const commercialDocumentsRelations = relations(
  commercialDocuments,
  ({ one, many }) => ({
    client: one(clients, {
      fields: [commercialDocuments.clientId],
      references: [clients.id],
    }),
    project: one(projects, {
      fields: [commercialDocuments.projectId],
      references: [projects.id],
    }),
    template: one(documentTemplates, {
      fields: [commercialDocuments.templateId],
      references: [documentTemplates.id],
    }),
    creator: one(user, {
      fields: [commercialDocuments.createdBy],
      references: [user.id],
    }),
    lineItems: many(commercialLineItems),
  }),
);

export const commercialLineItemsRelations = relations(
  commercialLineItems,
  ({ one }) => ({
    document: one(commercialDocuments, {
      fields: [commercialLineItems.commercialDocumentId],
      references: [commercialDocuments.id],
    }),
  }),
);
