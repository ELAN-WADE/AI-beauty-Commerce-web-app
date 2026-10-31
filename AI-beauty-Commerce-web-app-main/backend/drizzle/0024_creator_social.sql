CREATE TABLE "social_connections" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" text NOT NULL CHECK ("provider" IN ('tiktok','instagram')),
  "account_id" text NOT NULL,
  "profile" jsonb NOT NULL,
  "token_encrypted" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id","provider")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "social_provider_account_unique" ON "social_connections" ("provider","account_id");
--> statement-breakpoint
CREATE TABLE "social_oauth_requests" (
  "state_hash" text PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "session_id" uuid NOT NULL REFERENCES "user_sessions"("id") ON DELETE CASCADE,
  "provider" text NOT NULL CHECK ("provider" IN ('tiktok','instagram')),
  "browser_hash" text NOT NULL,
  "callback_url" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "consumed_at" timestamptz,
  "choices_encrypted" text
);
--> statement-breakpoint
CREATE INDEX "social_oauth_owner_idx" ON "social_oauth_requests" ("user_id","session_id");
