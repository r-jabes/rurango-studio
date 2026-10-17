import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { commercialDocuments } from "./commercial";
import { milestones, projects } from "./crm";

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => commercialDocuments.id, { onDelete: "restrict" }),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull().default("RWF"),
  paidOn: date("paid_on").notNull(),
  method: text("method"),
  reference: text("reference"),
  notes: text("notes"),
  recordedBy: text("recorded_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deploymentRecords = pgTable("deployment_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  environment: text("environment"),
  url: text("url"),
  notes: text("notes"),
  deployedAt: timestamp("deployed_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const qaChecklists = pgTable("qa_checklists", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  milestoneId: uuid("milestone_id").references(() => milestones.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const qaItems = pgTable("qa_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  checklistId: uuid("checklist_id")
    .notNull()
    .references(() => qaChecklists.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  isDone: boolean("is_done").default(false).notNull(),
  doneAt: timestamp("done_at", { withTimezone: true }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const handoverAcceptances = pgTable("handover_acceptances", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  acceptedByName: text("accepted_by_name"),
  notes: text("notes"),
  fileStorageKey: text("file_storage_key"),
  fileFilename: text("file_filename"),
  fileMimeType: text("file_mime_type"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(commercialDocuments, {
    fields: [payments.invoiceId],
    references: [commercialDocuments.id],
  }),
  recorder: one(user, {
    fields: [payments.recordedBy],
    references: [user.id],
  }),
}));

export const deploymentRecordsRelations = relations(
  deploymentRecords,
  ({ one }) => ({
    project: one(projects, {
      fields: [deploymentRecords.projectId],
      references: [projects.id],
    }),
    creator: one(user, {
      fields: [deploymentRecords.createdBy],
      references: [user.id],
    }),
  }),
);

export const qaChecklistsRelations = relations(qaChecklists, ({ one, many }) => ({
  project: one(projects, {
    fields: [qaChecklists.projectId],
    references: [projects.id],
  }),
  milestone: one(milestones, {
    fields: [qaChecklists.milestoneId],
    references: [milestones.id],
  }),
  items: many(qaItems),
}));

export const qaItemsRelations = relations(qaItems, ({ one }) => ({
  checklist: one(qaChecklists, {
    fields: [qaItems.checklistId],
    references: [qaChecklists.id],
  }),
}));

export const handoverAcceptancesRelations = relations(
  handoverAcceptances,
  ({ one }) => ({
    project: one(projects, {
      fields: [handoverAcceptances.projectId],
      references: [projects.id],
    }),
    creator: one(user, {
      fields: [handoverAcceptances.createdBy],
      references: [user.id],
    }),
  }),
);
