import { relations } from "drizzle-orm";
import {
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const cmsEntryTypeEnum = pgEnum("cms_entry_type", [
  "portfolio_project",
  "service",
  "post",
  "testimonial",
]);

export const cmsEntryStatusEnum = pgEnum("cms_entry_status", [
  "draft",
  "in_review",
  "published",
  "archived",
]);

/** Portfolio project body — aligned with web `Project` shape (without title/slug). */
export type PortfolioProjectBody = {
  summary: string;
  projectType: "product" | "client" | "internal" | "personal" | "concept";
  projectStatus: "shipped" | "in-progress" | "soft-launch" | "concept";
  year?: number;
  role?: string;
  audience?: string;
  scope?: string[];
  constraints?: string[];
  technologies?: string[];
  liveUrl: string;
  previewImage?: string;
  featured?: boolean;
  context?: string;
  problem?: string;
  approach?: string;
  decisions?: Array<{ title: string; detail: string }>;
  implementation?: string;
  outcomes?: string[];
  learnings?: string[];
  capabilities?: string[];
  notes?: string;
};

export type ServiceBody = {
  description: string;
  problem: string;
  deliverables: string[];
  relatedSlugs: string[];
};

export type PostBody = {
  excerpt?: string;
  markdown: string;
};

export type TestimonialBody = {
  quote: string;
  attribution: string;
  roleOrCompany?: string;
  /** Must stay false unless a real client approved publication. */
  clientApproved: boolean;
};

export type CmsBodyJson =
  | PortfolioProjectBody
  | ServiceBody
  | PostBody
  | TestimonialBody
  | Record<string, unknown>;

export const cmsEntries = pgTable(
  "cms_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: cmsEntryTypeEnum("type").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    status: cmsEntryStatusEnum("status").default("draft").notNull(),
    bodyJson: jsonb("body_json").$type<CmsBodyJson>().notNull().default({}),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    coverPublicPath: text("cover_public_path"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique().on(table.type, table.slug)],
);

export const cmsTags = pgTable("cms_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cmsEntryTags = pgTable(
  "cms_entry_tags",
  {
    entryId: uuid("entry_id")
      .notNull()
      .references(() => cmsEntries.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => cmsTags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.entryId, table.tagId] })],
);

export const cmsPublishEvents = pgTable("cms_publish_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  entryId: uuid("entry_id")
    .notNull()
    .references(() => cmsEntries.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  actorUserId: text("actor_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cmsEntriesRelations = relations(cmsEntries, ({ one, many }) => ({
  creator: one(user, {
    fields: [cmsEntries.createdBy],
    references: [user.id],
  }),
  updater: one(user, {
    fields: [cmsEntries.updatedBy],
    references: [user.id],
  }),
  tagLinks: many(cmsEntryTags),
  publishEvents: many(cmsPublishEvents),
}));

export const cmsTagsRelations = relations(cmsTags, ({ many }) => ({
  links: many(cmsEntryTags),
}));

export const cmsEntryTagsRelations = relations(cmsEntryTags, ({ one }) => ({
  entry: one(cmsEntries, {
    fields: [cmsEntryTags.entryId],
    references: [cmsEntries.id],
  }),
  tag: one(cmsTags, {
    fields: [cmsEntryTags.tagId],
    references: [cmsTags.id],
  }),
}));

export const cmsPublishEventsRelations = relations(
  cmsPublishEvents,
  ({ one }) => ({
    entry: one(cmsEntries, {
      fields: [cmsPublishEvents.entryId],
      references: [cmsEntries.id],
    }),
    actor: one(user, {
      fields: [cmsPublishEvents.actorUserId],
      references: [user.id],
    }),
  }),
);
