CREATE TABLE "thumbnails" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"original_path" varchar(512),
	"thumbnail_path" varchar(512),
	"width" integer,
	"height" integer,
	"format" varchar,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"job_id" varchar(255),
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (6) with time zone
);
--> statement-breakpoint
CREATE INDEX "thumbnails_status_idx" ON "thumbnails" USING btree ("status");--> statement-breakpoint
CREATE INDEX "thumbnails_job_id_idx" ON "thumbnails" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "thumbnails_created_at_idx" ON "thumbnails" USING btree ("created_at");