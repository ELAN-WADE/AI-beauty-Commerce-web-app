CREATE TABLE "community_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"post_id" uuid,
	"media_key" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_media_media_key_unique" UNIQUE("media_key"),
	CONSTRAINT "community_media_mime_allowed" CHECK ("mime" IN ('image/jpeg','image/png','image/webp','video/mp4','video/webm')),
	CONSTRAINT "community_media_bytes_positive" CHECK ("bytes" > 0 AND "bytes" <= 67108864),
	CONSTRAINT "community_media_status_allowed" CHECK ("status" IN ('pending','attached','failed'))
);
--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "media_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "community_media" ADD CONSTRAINT "community_media_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_media" ADD CONSTRAINT "community_media_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_media_user_idx" ON "community_media" USING btree ("user_id","created_at");