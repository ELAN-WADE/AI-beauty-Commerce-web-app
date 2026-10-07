CREATE TABLE "inventory_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'DISTRIBUTOR' NOT NULL,
	"distributor_id" uuid,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"operating_hours" text DEFAULT '' NOT NULL,
	"delivery_enabled" boolean DEFAULT true NOT NULL,
	"pickup_enabled" boolean DEFAULT false NOT NULL,
	"delivery_fee_kobo" integer,
	"eta_text" text DEFAULT 'Delivery estimate confirmed with your order.' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_locations_code_unique" UNIQUE("code"),
	CONSTRAINT "inventory_locations_distributor_id_unique" UNIQUE("distributor_id"),
	CONSTRAINT "location_type_allowed" CHECK ("type" IN ('WAREHOUSE','DISTRIBUTOR','RETAIL_STORE')),
	CONSTRAINT "location_fee_nonnegative" CHECK ("delivery_fee_kobo" IS NULL OR "delivery_fee_kobo" >= 0)
);
--> statement-breakpoint
INSERT INTO "inventory_locations" ("id", "code", "name", "type", "city", "state", "address", "delivery_enabled", "pickup_enabled", "eta_text", "is_active") VALUES ('00000000-0000-4000-8000-000000000001', 'HQ-LAGOS', 'Lagos Formulation Lab (HQ)', 'WAREHOUSE', 'Lagos', 'Lagos', 'Lagos, Nigeria', true, false, 'Nationwide dispatch in 2-4 business days.', true) ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
CREATE TABLE "restock_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"qty" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" text DEFAULT 'REQUESTED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "restock_requests_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "restock_qty_positive" CHECK ("qty" > 0)
);
--> statement-breakpoint
CREATE TABLE "stock_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_location_id" uuid NOT NULL,
	"destination_location_id" uuid NOT NULL,
	"status" text DEFAULT 'DISPATCHED' NOT NULL,
	"idempotency_key" text NOT NULL,
	"fingerprint" text NOT NULL,
	"dispatched_by" uuid NOT NULL,
	"received_by" uuid,
	"dispatched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"received_at" timestamp with time zone,
	"note" text DEFAULT '' NOT NULL,
	CONSTRAINT "stock_transfers_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "transfer_locations_differ" CHECK ("source_location_id" <> "destination_location_id"),
	CONSTRAINT "transfer_status_allowed" CHECK ("status" IN ('DISPATCHED','RECEIVED'))
);
--> statement-breakpoint
CREATE TABLE "transfer_items" (
	"transfer_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"qty" integer NOT NULL,
	CONSTRAINT "transfer_items_transfer_id_variant_id_pk" PRIMARY KEY("transfer_id","variant_id"),
	CONSTRAINT "transfer_qty_positive" CHECK ("qty" > 0)
);
--> statement-breakpoint
CREATE TABLE "commission_awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"amount_kobo" bigint NOT NULL,
	"reversed_kobo" bigint DEFAULT 0 NOT NULL,
	"hold_days" integer DEFAULT 14 NOT NULL,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commission_reversal_bounds" CHECK ("amount_kobo" > 0 AND "reversed_kobo" BETWEEN 0 AND "amount_kobo")
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_id" uuid NOT NULL,
	"wallet_id" uuid,
	"bucket" text NOT NULL,
	"amount_kobo" bigint NOT NULL,
	CONSTRAINT "ledger_bucket_owner" CHECK (("wallet_id" IS NULL AND "bucket" = 'PLATFORM') OR ("wallet_id" IS NOT NULL AND "bucket" IN ('PENDING','AVAILABLE','HELD'))),
	CONSTRAINT "ledger_safe_amount" CHECK ("amount_kobo" <> 0 AND "amount_kobo" BETWEEN -9007199254740991 AND 9007199254740991)
);
--> statement-breakpoint
CREATE TABLE "ledger_journals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_key" text NOT NULL,
	"fingerprint" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_journals_event_key_unique" UNIQUE("event_key")
);
--> statement-breakpoint
CREATE TABLE "partner_bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"bank_code" text NOT NULL,
	"bank_name" text NOT NULL,
	"account_number" text NOT NULL,
	"account_name" text NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"verification_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"distributor_id" uuid,
	"creator_id" uuid,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_accounts_distributor_id_unique" UNIQUE("distributor_id"),
	CONSTRAINT "wallet_accounts_creator_id_unique" UNIQUE("creator_id"),
	CONSTRAINT "wallet_exactly_one_owner" CHECK (("distributor_id" IS NOT NULL)::int + ("creator_id" IS NOT NULL)::int = 1),
	CONSTRAINT "wallet_ngn_only" CHECK ("currency" = 'NGN')
);
--> statement-breakpoint
CREATE TABLE "withdrawal_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"amount_kobo" bigint NOT NULL,
	"status" text DEFAULT 'REQUESTED' NOT NULL,
	"idempotency_key" text NOT NULL,
	"reviewed_by" uuid,
	"payment_reference" text,
	"evidence" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "withdrawal_requests_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "withdrawal_requests_payment_reference_unique" UNIQUE("payment_reference"),
	CONSTRAINT "withdrawal_amount_positive" CHECK ("amount_kobo" > 0 AND "amount_kobo" <= 9007199254740991),
	CONSTRAINT "withdrawal_status_allowed" CHECK ("status" IN ('REQUESTED','APPROVED','PROCESSING','PAID','REJECTED','FAILED'))
);
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "order_status_allowed";--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "location_id" uuid DEFAULT '00000000-0000-4000-8000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "location_id" uuid DEFAULT '00000000-0000-4000-8000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_levels" ADD COLUMN "location_id" uuid DEFAULT '00000000-0000-4000-8000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_levels" DROP CONSTRAINT IF EXISTS "stock_levels_pkey";--> statement-breakpoint
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_location_id_variant_id_pk" PRIMARY KEY("location_id","variant_id");--> statement-breakpoint
INSERT INTO "inventory_locations" ("code", "name", "type", "distributor_id", "city", "state", "address", "phone", "operating_hours", "delivery_enabled", "pickup_enabled", "eta_text", "is_active") SELECT 'DIST-' || substring("id"::text, 1, 8), "name", 'DISTRIBUTOR', "id", "city", "state", "address", "phone", "operating_hours", true, "pickup_available", 'Delivery estimate confirmed with your order.', false FROM "distributors" ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "stock_levels" ("location_id", "variant_id", "on_hand", "reserved") SELECT "l"."id", "ds"."variant_id", GREATEST("ds"."quantity", 0), 0 FROM "distributor_stock" "ds" INNER JOIN "inventory_locations" "l" ON "l"."distributor_id" = "ds"."distributor_id" WHERE "ds"."quantity" > 0 ON CONFLICT DO NOTHING;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "creator_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "creator_commission_bps" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "distributor_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "distributor_commission_bps" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fulfilment_location_id" uuid DEFAULT '00000000-0000-4000-8000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fulfilment_method" text DEFAULT 'DELIVERY' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fulfilment_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pickup_code_hash" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pickup_code_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pickup_code_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "checkout_fingerprint" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "guest_session_id" text;--> statement-breakpoint
ALTER TABLE "distributors" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "distributors" ADD COLUMN "commission_bps" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_locations" ADD CONSTRAINT "inventory_locations_distributor_id_distributors_id_fk" FOREIGN KEY ("distributor_id") REFERENCES "public"."distributors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_requests" ADD CONSTRAINT "restock_requests_location_id_inventory_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_requests" ADD CONSTRAINT "restock_requests_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_requests" ADD CONSTRAINT "restock_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_source_location_id_inventory_locations_id_fk" FOREIGN KEY ("source_location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_destination_location_id_inventory_locations_id_fk" FOREIGN KEY ("destination_location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_dispatched_by_users_id_fk" FOREIGN KEY ("dispatched_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_items" ADD CONSTRAINT "transfer_items_transfer_id_stock_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."stock_transfers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_items" ADD CONSTRAINT "transfer_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_awards" ADD CONSTRAINT "commission_awards_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_awards" ADD CONSTRAINT "commission_awards_wallet_id_wallet_accounts_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_journal_id_ledger_journals_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."ledger_journals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_wallet_id_wallet_accounts_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_bank_accounts" ADD CONSTRAINT "partner_bank_accounts_wallet_id_wallet_accounts_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_bank_accounts" ADD CONSTRAINT "partner_bank_accounts_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_distributor_id_distributors_id_fk" FOREIGN KEY ("distributor_id") REFERENCES "public"."distributors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_wallet_id_wallet_accounts_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_bank_account_id_partner_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."partner_bank_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "locations_city_state_idx" ON "inventory_locations" USING btree ("city","state");--> statement-breakpoint
CREATE INDEX "restocks_location_idx" ON "restock_requests" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "transfers_destination_idx" ON "stock_transfers" USING btree ("destination_location_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_order_wallet_unique" ON "commission_awards" USING btree ("order_id","wallet_id");--> statement-breakpoint
CREATE INDEX "ledger_wallet_bucket_idx" ON "ledger_entries" USING btree ("wallet_id","bucket");--> statement-breakpoint
CREATE INDEX "ledger_journal_idx" ON "ledger_entries" USING btree ("journal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_bank_unique" ON "partner_bank_accounts" USING btree ("wallet_id","bank_code","account_number");--> statement-breakpoint
CREATE INDEX "wallets_user_idx" ON "wallet_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "withdrawals_wallet_idx" ON "withdrawal_requests" USING btree ("wallet_id","created_at");--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_location_id_inventory_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_location_id_inventory_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_location_id_inventory_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_distributor_id_distributors_id_fk" FOREIGN KEY ("distributor_id") REFERENCES "public"."distributors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_fulfilment_location_id_inventory_locations_id_fk" FOREIGN KEY ("fulfilment_location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distributors" ADD CONSTRAINT "distributors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stock_variant_idx" ON "stock_levels" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "orders_location_status_idx" ON "orders" USING btree ("fulfilment_location_id","status");--> statement-breakpoint
ALTER TABLE "distributors" ADD CONSTRAINT "distributors_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "order_fulfilment_method" CHECK ("fulfilment_method" IN ('DELIVERY','PICKUP'));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "order_commission_rates" CHECK ("creator_commission_bps" BETWEEN 0 AND 5000 AND "distributor_commission_bps" BETWEEN 0 AND 5000);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "order_status_allowed" CHECK ("status" IN ('PENDING','PAID','FULFILLING','READY_PICKUP','SHIPPED','DELIVERED','CANCELLED','REFUNDED'));--> statement-breakpoint
ALTER TABLE "distributors" ADD CONSTRAINT "distributor_commission_bps" CHECK ("commission_bps" BETWEEN 0 AND 5000);--> statement-breakpoint
INSERT INTO "permissions" ("id", "description") VALUES ('network:manage', 'Manage fulfilment network locations and transfers'), ('payouts:manage', 'Review partner bank accounts and payouts') ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES ('ADMIN', 'network:manage'), ('ADMIN', 'payouts:manage'), ('SUPER_ADMIN', 'network:manage'), ('SUPER_ADMIN', 'payouts:manage') ON CONFLICT ("role_id", "permission_id") DO NOTHING;