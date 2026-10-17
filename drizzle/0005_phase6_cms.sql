CREATE TYPE "public"."cms_entry_type" AS ENUM('portfolio_project', 'service', 'post', 'testimonial');--> statement-breakpoint
CREATE TYPE "public"."cms_entry_status" AS ENUM('draft', 'in_review', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "cms_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "cms_entry_type" NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"status" "cms_entry_status" DEFAULT 'draft' NOT NULL,
	"body_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"cover_public_path" text,
	"published_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cms_entries_type_slug_unique" UNIQUE("type","slug")
);
--> statement-breakpoint
CREATE TABLE "cms_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cms_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "cms_entry_tags" (
	"entry_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "cms_entry_tags_entry_id_tag_id_pk" PRIMARY KEY("entry_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "cms_publish_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"action" text NOT NULL,
	"actor_user_id" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cms_entries" ADD CONSTRAINT "cms_entries_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_entries" ADD CONSTRAINT "cms_entries_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_entry_tags" ADD CONSTRAINT "cms_entry_tags_entry_id_cms_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."cms_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_entry_tags" ADD CONSTRAINT "cms_entry_tags_tag_id_cms_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."cms_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_publish_events" ADD CONSTRAINT "cms_publish_events_entry_id_cms_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."cms_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_publish_events" ADD CONSTRAINT "cms_publish_events_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
