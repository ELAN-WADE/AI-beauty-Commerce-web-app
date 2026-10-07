ALTER TABLE "refunds" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_idempotency_key_unique" UNIQUE("idempotency_key");