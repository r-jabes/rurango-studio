import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** Singleton-style company settings (one row expected). */
export const companySettings = pgTable("company_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  legalName: text("legal_name").notNull().default("RURANGO"),
  tradingName: text("trading_name").notNull().default("RURANGO"),
  defaultCurrency: text("default_currency").notNull().default("RWF"),
  addressJson: jsonb("address_json").$type<Record<string, string>>(),
  taxId: text("tax_id"),
  invoicePrefix: text("invoice_prefix").notNull().default("INV"),
  quotationPrefix: text("quotation_prefix").notNull().default("QUO"),
  proposalPrefix: text("proposal_prefix").notNull().default("PRO"),
  agreementPrefix: text("agreement_prefix").notNull().default("AGR"),
  uploadMaxBytes: integer("upload_max_bytes").notNull().default(26_214_400),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: text("actor_user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
