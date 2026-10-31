CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"source" text DEFAULT 'website' NOT NULL,
	"consent_version" text DEFAULT 'journal-v1' NOT NULL,
	"confirm_token_hash" text,
	"confirm_expires_at" timestamp with time zone,
	"unsubscribe_token_hash" text,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "newsletter_subscribers_confirm_token_hash_unique" UNIQUE("confirm_token_hash"),
	CONSTRAINT "newsletter_subscribers_unsubscribe_token_hash_unique" UNIQUE("unsubscribe_token_hash"),
	CONSTRAINT "newsletter_status_allowed" CHECK (status IN ('PENDING','CONFIRMED','UNSUBSCRIBED'))
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "presentation" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "publication_key" text;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_publication_key_unique" UNIQUE("publication_key");