ALTER TABLE "notification_outbox" ADD COLUMN IF NOT EXISTS "idempotency_key" text;
--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD COLUMN IF NOT EXISTS "provider" text;
--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD COLUMN IF NOT EXISTS "provider_message_id" text;
--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD COLUMN IF NOT EXISTS "sent_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD COLUMN IF NOT EXISTS "last_error" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "outbox_idempotency_key_unique" ON "notification_outbox" ("idempotency_key") WHERE "idempotency_key" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "last_active_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "creator_applications" DROP CONSTRAINT IF EXISTS "creator_app_status_allowed";
--> statement-breakpoint
ALTER TABLE "creator_applications" ADD CONSTRAINT "creator_app_status_allowed" CHECK ("status" IN ('pending','under_review','approved','rejected'));
--> statement-breakpoint
ALTER TABLE "distributor_applications" DROP CONSTRAINT IF EXISTS "distributor_app_status_allowed";
--> statement-breakpoint
ALTER TABLE "distributor_applications" ADD CONSTRAINT "distributor_app_status_allowed" CHECK ("status" IN ('pending','under_review','approved','rejected'));

