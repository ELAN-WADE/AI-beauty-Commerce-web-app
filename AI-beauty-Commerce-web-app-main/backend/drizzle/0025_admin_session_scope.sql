ALTER TABLE "user_sessions" ADD COLUMN "auth_scope" text NOT NULL DEFAULT 'CUSTOMER' CHECK ("auth_scope" IN ('CUSTOMER', 'ADMIN'));
--> statement-breakpoint
ALTER TABLE "oauth_grants" ADD COLUMN "auth_scope" text NOT NULL DEFAULT 'CUSTOMER' CHECK ("auth_scope" IN ('CUSTOMER', 'ADMIN'));
--> statement-breakpoint
-- Legacy staff cookies must stop identifying their owner on the storefront.
-- Factors, passwords and session rows are preserved; staff sign in through the
-- private portal once to receive the separate administrator cookie.
UPDATE "user_sessions" SET "auth_scope" = 'ADMIN'
WHERE EXISTS (
  SELECT 1 FROM "user_roles"
  WHERE "user_roles"."user_id" = "user_sessions"."user_id"
    AND "user_roles"."role_id" IN ('ADMIN', 'STAFF', 'SUPER_ADMIN', 'INVENTORY_MANAGER', 'SUPPORT')
);
--> statement-breakpoint
CREATE INDEX "user_sessions_active_scope_idx" ON "user_sessions" ("user_id", "auth_scope", "created_at") WHERE "revoked_at" IS NULL;
