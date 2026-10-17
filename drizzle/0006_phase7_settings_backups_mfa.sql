ALTER TABLE "user" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings" ADD COLUMN "support_email" text;--> statement-breakpoint
ALTER TABLE "company_settings" ADD COLUMN "logo_storage_key" text;--> statement-breakpoint
CREATE TYPE "public"."backup_kind" AS ENUM('db', 'files', 'full');--> statement-breakpoint
CREATE TYPE "public"."backup_status" AS ENUM('running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "backup_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "backup_kind" NOT NULL,
	"status" "backup_status" DEFAULT 'running' NOT NULL,
	"destination_ref" text,
	"byte_size" integer,
	"checksum" text,
	"error_message" text,
	"triggered_by" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"metadata_json" jsonb
);
