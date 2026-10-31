CREATE TABLE "crypto_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"attempt_id" uuid,
	"asset" text NOT NULL,
	"network" text NOT NULL,
	"deposit_address" text NOT NULL,
	"amount_kobo" integer NOT NULL,
	"amount_crypto" text NOT NULL,
	"exchange_rate_ngn" text NOT NULL,
	"network_fee_crypto" text DEFAULT '0' NOT NULL,
	"total_crypto" text NOT NULL,
	"tx_hash" text,
	"confirmations" integer DEFAULT 0 NOT NULL,
	"required_confirmations" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crypto_status_allowed" CHECK (status IN ('PENDING','CONFIRMED','COMPLETED','EXPIRED','FAILED'))
);
--> statement-breakpoint
ALTER TABLE "crypto_payments" ADD CONSTRAINT "crypto_payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "crypto_payments" ADD CONSTRAINT "crypto_payments_attempt_id_payment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."payment_attempts"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "crypto_payments_order_idx" ON "crypto_payments" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX "crypto_payments_status_idx" ON "crypto_payments" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "crypto_payments_tx_hash_idx" ON "crypto_payments" USING btree ("tx_hash");

