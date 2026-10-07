CREATE TABLE "wholesale_prices" (
	"variant_id" uuid NOT NULL,
	"tier" text NOT NULL,
	"unit_price_kobo" integer NOT NULL,
	"units_per_carton" integer NOT NULL,
	"minimum_cartons" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wholesale_prices_variant_id_tier_pk" PRIMARY KEY("variant_id","tier"),
	CONSTRAINT "wholesale_tier_allowed" CHECK ("tier" IN ('Bronze','Silver','Gold')),
	CONSTRAINT "wholesale_price_positive" CHECK ("unit_price_kobo" > 0 AND "units_per_carton" BETWEEN 1 AND 1000 AND "minimum_cartons" BETWEEN 1 AND 1000)
);
--> statement-breakpoint
CREATE TABLE "wholesale_stock_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idempotency_key" text NOT NULL,
	"fingerprint" text NOT NULL,
	"user_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wholesale_stock_events_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "stock_levels" DROP CONSTRAINT "stock_levels_location_id_variant_id_pk";--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "pool" text DEFAULT 'PLATFORM' NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "pool" text DEFAULT 'PLATFORM' NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_levels" ADD COLUMN "pool" text DEFAULT 'PLATFORM' NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_location_id_variant_id_pool_pk" PRIMARY KEY("location_id","variant_id","pool");--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "kind" text DEFAULT 'RETAIL' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "wholesale_location_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "wholesale_terms" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "wholesale_dispatched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "wholesale_received_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "wholesale_returned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "wholesale_restored_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "wholesale_prices" ADD CONSTRAINT "wholesale_prices_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesale_stock_events" ADD CONSTRAINT "wholesale_stock_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesale_stock_events" ADD CONSTRAINT "wholesale_stock_events_location_id_inventory_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_wholesale_location_id_inventory_locations_id_fk" FOREIGN KEY ("wholesale_location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_wholesale_location_idx" ON "orders" USING btree ("wholesale_location_id","created_at");--> statement-breakpoint
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_pool_allowed" CHECK ("pool" IN ('PLATFORM','WHOLESALE'));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "order_kind_allowed" CHECK ("kind" IN ('RETAIL','WHOLESALE'));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "wholesale_order_integrity" CHECK ("kind" <> 'WHOLESALE' OR ("wholesale_location_id" IS NOT NULL AND "user_id" IS NOT NULL AND "distributor_id" IS NULL AND "creator_id" IS NULL AND "creator_commission_bps" = 0 AND "distributor_commission_bps" = 0 AND "discount_kobo" = 0 AND "fulfilment_method" = 'DELIVERY'));
