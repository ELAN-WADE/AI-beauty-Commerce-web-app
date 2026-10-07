ALTER TABLE "orders" ADD COLUMN "guest_access_token_hash" text;
--> statement-breakpoint
-- Forward-fix installs which applied the original 0006 permission migration.
INSERT INTO "permissions" ("id", "description") VALUES ('partners:review', 'Review creator and distributor applications') ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES ('ADMIN', 'partners:review'), ('SUPER_ADMIN', 'partners:review') ON CONFLICT ("role_id", "permission_id") DO NOTHING;
--> statement-breakpoint
-- Invalidate pre-encryption outbox payloads; customers can request fresh links.
UPDATE "notification_outbox" SET "payload" = '{}'::jsonb, "status" = 'failed' WHERE "template" IN ('auth.verify-email','auth.reset-password') AND ("payload" ? 'token' OR "payload" ? 'verifyUrl' OR "payload" ? 'resetUrl');
