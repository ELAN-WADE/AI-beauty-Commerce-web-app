CREATE TABLE "review_helpful" (
	"review_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_helpful_review_id_user_id_pk" PRIMARY KEY("review_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" uuid,
	"order_id" uuid,
	"author_name" text NOT NULL,
	"rating" integer NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"verified_purchase" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_rating_range" CHECK ("rating" >= 1 AND "rating" <= 5),
	CONSTRAINT "review_status_allowed" CHECK ("status" IN ('pending','approved','rejected')),
	CONSTRAINT "review_helpful_nonnegative" CHECK ("helpful_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "loyalty_accounts" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_txns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"type" text NOT NULL,
	"ref_type" text,
	"ref_id" text,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_txn_type_allowed" CHECK ("type" IN ('earn','redeem','adjust')),
	CONSTRAINT "loyalty_txn_nonzero" CHECK ("points" <> 0)
);
--> statement-breakpoint
CREATE TABLE "loyalty_vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_kobo" integer NOT NULL,
	"min_spend_kobo" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"redeemed_order_id" uuid,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_vouchers_code_unique" UNIQUE("code"),
	CONSTRAINT "voucher_amount_positive" CHECK ("amount_kobo" > 0),
	CONSTRAINT "voucher_status_allowed" CHECK ("status" IN ('active','redeemed','expired','cancelled'))
);
--> statement-breakpoint
CREATE TABLE "shipment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"status" text NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text DEFAULT 'local' NOT NULL,
	"tracking_ref" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'preparing' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipments_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "shipment_status_allowed" CHECK ("status" IN ('preparing','dispatched','in_transit','delivered','failed'))
);
--> statement-breakpoint
CREATE TABLE "shipping_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"fee_kobo" integer NOT NULL,
	"eta_text" text DEFAULT '' NOT NULL,
	CONSTRAINT "zone_fee_nonnegative" CHECK ("fee_kobo" >= 0)
);
--> statement-breakpoint
CREATE TABLE "notification_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"channel" text NOT NULL,
	"template" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_channel_allowed" CHECK ("channel" IN ('email','sms','whatsapp','push')),
	CONSTRAINT "outbox_status_allowed" CHECK ("status" IN ('pending','sending','sent','failed'))
);
--> statement-breakpoint
ALTER TABLE "review_helpful" ADD CONSTRAINT "review_helpful_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful" ADD CONSTRAINT "review_helpful_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_txns" ADD CONSTRAINT "loyalty_txns_account_id_loyalty_accounts_user_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."loyalty_accounts"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_vouchers" ADD CONSTRAINT "loyalty_vouchers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_vouchers" ADD CONSTRAINT "loyalty_vouchers_redeemed_order_id_orders_id_fk" FOREIGN KEY ("redeemed_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reviews_product_status_idx" ON "reviews" USING btree ("product_id","status");--> statement-breakpoint
CREATE INDEX "reviews_user_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "loyalty_txns_account_idx" ON "loyalty_txns" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_txn_ref_unique" ON "loyalty_txns" USING btree ("account_id","ref_type","ref_id");--> statement-breakpoint
CREATE INDEX "vouchers_user_idx" ON "loyalty_vouchers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shipment_events_shipment_idx" ON "shipment_events" USING btree ("shipment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shipping_zone_unique" ON "shipping_zones" USING btree ("city","state");--> statement-breakpoint
CREATE INDEX "outbox_claim_idx" ON "notification_outbox" USING btree ("status","next_attempt_at");--> statement-breakpoint
-- Reference data: NG delivery zones (fees in kobo; mirrors storefront city pricing).
INSERT INTO "shipping_zones" ("city", "state", "fee_kobo", "eta_text") VALUES
  ('Lagos', 'Lagos State', 100000, 'Same-day'),
  ('Abuja', 'FCT', 150000, '2-4 hours'),
  ('Port Harcourt', 'Rivers State', 150000, '3-5 hours'),
  ('Ibadan', 'Oyo State', 120000, '2-4 hours'),
  ('Kano', 'Kano State', 180000, '3-6 hours'),
  ('Enugu', 'Enugu State', 160000, '4-6 hours'),
  ('', 'DEFAULT', 450000, '3-5 business days')
ON CONFLICT ("city", "state") DO NOTHING;