CREATE TABLE "request_quotas" (
	"key_hash" text PRIMARY KEY NOT NULL,
	"hits" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "request_quotas_reset_idx" ON "request_quotas" USING btree ("reset_at");