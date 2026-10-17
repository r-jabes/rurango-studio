CREATE TYPE "public"."commercial_doc_type" AS ENUM('proposal', 'quotation', 'agreement', 'invoice', 'receipt', 'handover');--> statement-breakpoint
CREATE TYPE "public"."commercial_doc_status" AS ENUM('draft', 'issued', 'accepted', 'declined', 'void', 'superseded');--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "commercial_doc_type" NOT NULL,
	"name" text NOT NULL,
	"body_html" text,
	"default_payment_terms" text,
	"default_notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commercial_number_sequences" (
	"doc_type" "commercial_doc_type" NOT NULL,
	"year" integer NOT NULL,
	"last_seq" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "commercial_number_sequences_doc_type_year_unique" UNIQUE("doc_type","year")
);
--> statement-breakpoint
CREATE TABLE "commercial_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "commercial_doc_type" NOT NULL,
	"number" text NOT NULL,
	"title" text NOT NULL,
	"client_id" uuid NOT NULL,
	"project_id" uuid,
	"template_id" uuid,
	"status" "commercial_doc_status" DEFAULT 'draft' NOT NULL,
	"currency" text DEFAULT 'RWF' NOT NULL,
	"issue_date" date,
	"due_date" date,
	"expiry_date" date,
	"payment_terms" text,
	"notes" text,
	"body_html" text,
	"subtotal_minor" integer DEFAULT 0 NOT NULL,
	"tax_minor" integer DEFAULT 0 NOT NULL,
	"total_minor" integer DEFAULT 0 NOT NULL,
	"snapshot_json" jsonb,
	"pdf_storage_key" text,
	"signed_file_storage_key" text,
	"signed_file_filename" text,
	"signed_file_mime_type" text,
	"signed_at" timestamp with time zone,
	"signed_by_name" text,
	"signed_notes" text,
	"issued_at" timestamp with time zone,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commercial_documents_type_number_unique" UNIQUE("type","number")
);
--> statement-breakpoint
CREATE TABLE "commercial_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commercial_document_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" text DEFAULT '1' NOT NULL,
	"unit_amount_minor" integer DEFAULT 0 NOT NULL,
	"tax_rate_bps" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commercial_documents" ADD CONSTRAINT "commercial_documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_documents" ADD CONSTRAINT "commercial_documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_documents" ADD CONSTRAINT "commercial_documents_template_id_document_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."document_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_documents" ADD CONSTRAINT "commercial_documents_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_line_items" ADD CONSTRAINT "commercial_line_items_commercial_document_id_commercial_documents_id_fk" FOREIGN KEY ("commercial_document_id") REFERENCES "public"."commercial_documents"("id") ON DELETE cascade ON UPDATE no action;
