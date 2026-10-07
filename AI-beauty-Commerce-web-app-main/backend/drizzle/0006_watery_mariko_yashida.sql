CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_type" text DEFAULT 'user' NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"before" jsonb,
	"after" jsonb,
	"ip" text,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_time_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
-- S7 permission matrix: new capabilities + role bundles (least-privilege).
-- STAFF keeps prior catalog access; SUPPORT is read-only; grants are SUPER_ADMIN-only.
-- Fresh-install fix: roles are otherwise only created by seed.ts, so ensure they exist here.
INSERT INTO "roles" ("id", "description") VALUES
  ('CUSTOMER', 'Registered shopper; owner-scoped access only.'),
  ('DISTRIBUTOR', 'Approved owner-scoped fulfilment partner.'),
  ('CREATOR', 'Approved owner-scoped affiliate.'),
  ('SUPPORT', 'Read orders/users for customer care; no mutations.'),
  ('INVENTORY_MANAGER', 'Manages stock levels and movements.'),
  ('STAFF', 'Order fulfilment and content moderation.'),
  ('ADMIN', 'Full operational access except role grants.'),
  ('SUPER_ADMIN', 'Role grants and break-glass access.')
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "permissions" ("id", "description") VALUES
  ('orders:read:own', 'orders:read:own'),
  ('orders:read:all', 'orders:read:all'),
  ('orders:update:status', 'orders:update:status'),
  ('users:read:all', 'users:read:all'),
  ('products:write', 'products:write'),
  ('inventory:write', 'inventory:write'),
  ('reviews:moderate', 'reviews:moderate'),
  ('refunds:write', 'refunds:write'),
  ('payments:confirm', 'Confirm manual transfer claims'),
  ('loyalty:adjust', 'Adjust loyalty balances'),
  ('roles:grant', 'roles:grant'),
  ('audit:read', 'audit:read')
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
  ('STAFF', 'products:write'),
  ('STAFF', 'orders:read:all'),
  ('STAFF', 'orders:update:status'),
  ('STAFF', 'reviews:moderate'),
  ('STAFF', 'payments:confirm'),
  ('SUPPORT', 'users:read:all'),
  ('SUPPORT', 'orders:read:all'),
  ('INVENTORY_MANAGER', 'inventory:write'),
  ('ADMIN', 'orders:read:all'),
  ('ADMIN', 'orders:update:status'),
  ('ADMIN', 'users:read:all'),
  ('ADMIN', 'products:write'),
  ('ADMIN', 'inventory:write'),
  ('ADMIN', 'reviews:moderate'),
  ('ADMIN', 'refunds:write'),
  ('ADMIN', 'payments:confirm'),
  ('ADMIN', 'loyalty:adjust'),
  ('ADMIN', 'audit:read'),
  ('SUPER_ADMIN', 'orders:read:all'),
  ('SUPER_ADMIN', 'orders:update:status'),
  ('SUPER_ADMIN', 'users:read:all'),
  ('SUPER_ADMIN', 'products:write'),
  ('SUPER_ADMIN', 'inventory:write'),
  ('SUPER_ADMIN', 'reviews:moderate'),
  ('SUPER_ADMIN', 'refunds:write'),
  ('SUPER_ADMIN', 'payments:confirm'),
  ('SUPER_ADMIN', 'loyalty:adjust'),
  ('SUPER_ADMIN', 'audit:read'),
  ('SUPER_ADMIN', 'roles:grant')
ON CONFLICT ("role_id", "permission_id") DO NOTHING;