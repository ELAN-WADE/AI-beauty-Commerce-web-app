CREATE TABLE "distributor_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"business_name" text DEFAULT '' NOT NULL,
	"city" text NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"whatsapp" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"review_note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "distributor_app_status_allowed" CHECK ("status" IN ('pending','approved','rejected'))
);
--> statement-breakpoint
CREATE TABLE "distributor_stock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"distributor_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "distributor_qty_nonnegative" CHECK ("quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "distributors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"business_name" text DEFAULT '' NOT NULL,
	"city" text NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"whatsapp" text DEFAULT '' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"tier" text DEFAULT 'Bronze' NOT NULL,
	"is_online_only" boolean DEFAULT false NOT NULL,
	"pickup_available" boolean DEFAULT true NOT NULL,
	"operating_hours" text DEFAULT '' NOT NULL,
	"rating" numeric(3, 2) DEFAULT '5' NOT NULL,
	"reviews_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "distributor_tier_allowed" CHECK ("tier" IN ('Bronze','Silver','Gold')),
	CONSTRAINT "distributor_rating_range" CHECK ("rating" >= 0 AND "rating" <= 5)
);
--> statement-breakpoint
CREATE TABLE "creator_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"handle" text DEFAULT '' NOT NULL,
	"platform" text DEFAULT 'Instagram' NOT NULL,
	"niche" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"review_note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creator_app_status_allowed" CHECK ("status" IN ('pending','approved','rejected')),
	CONSTRAINT "creator_app_platform_allowed" CHECK ("platform" IN ('Instagram','TikTok','YouTube'))
);
--> statement-breakpoint
CREATE TABLE "creators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"handle" text DEFAULT '' NOT NULL,
	"platform" text DEFAULT 'Instagram' NOT NULL,
	"niche" text DEFAULT '' NOT NULL,
	"avatar_url" text DEFAULT '' NOT NULL,
	"promo_code" text NOT NULL,
	"discount_percent" integer DEFAULT 10 NOT NULL,
	"commission_rate" integer DEFAULT 12 NOT NULL,
	"total_sales_kobo" bigint DEFAULT 0 NOT NULL,
	"commission_earned_kobo" bigint DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"orders_count" integer DEFAULT 0 NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creators_promo_code_unique" UNIQUE("promo_code"),
	CONSTRAINT "creator_platform_allowed" CHECK ("platform" IN ('Instagram','TikTok','YouTube')),
	CONSTRAINT "creator_discount_range" CHECK ("discount_percent" >= 0 AND "discount_percent" <= 50),
	CONSTRAINT "creator_commission_range" CHECK ("commission_rate" >= 0 AND "commission_rate" <= 50)
);
--> statement-breakpoint
CREATE TABLE "community_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"sender_name" text NOT NULL,
	"sender_avatar" text DEFAULT '' NOT NULL,
	"channel" text DEFAULT 'routine' NOT NULL,
	"message" text NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_likes_nonnegative" CHECK ("likes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"author_name" text NOT NULL,
	"author_handle" text DEFAULT '' NOT NULL,
	"author_avatar" text DEFAULT '' NOT NULL,
	"author_role" text DEFAULT 'Member' NOT NULL,
	"content" text NOT NULL,
	"media_type" text,
	"media_url" text,
	"tagged_product_id" uuid,
	"tagged_hashtag" text,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_media_allowed" CHECK ("media_type" IS NULL OR "media_type" IN ('image','video')),
	CONSTRAINT "post_likes_nonnegative" CHECK ("likes_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "post_likes" (
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_likes_post_id_user_id_pk" PRIMARY KEY("post_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "order_totals_nonnegative";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_kobo" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "creator_code" text;--> statement-breakpoint
ALTER TABLE "distributor_applications" ADD CONSTRAINT "distributor_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distributor_applications" ADD CONSTRAINT "distributor_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distributor_stock" ADD CONSTRAINT "distributor_stock_distributor_id_distributors_id_fk" FOREIGN KEY ("distributor_id") REFERENCES "public"."distributors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distributor_stock" ADD CONSTRAINT "distributor_stock_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD CONSTRAINT "creator_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD CONSTRAINT "creator_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creators" ADD CONSTRAINT "creators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_messages" ADD CONSTRAINT "community_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_tagged_product_id_products_id_fk" FOREIGN KEY ("tagged_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "distributor_apps_status_idx" ON "distributor_applications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "distributor_variant_unique" ON "distributor_stock" USING btree ("distributor_id","variant_id");--> statement-breakpoint
CREATE INDEX "distributor_stock_variant_idx" ON "distributor_stock" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "distributors_city_idx" ON "distributors" USING btree ("city");--> statement-breakpoint
CREATE INDEX "creator_apps_status_idx" ON "creator_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_channel_time_idx" ON "community_messages" USING btree ("channel","created_at");--> statement-breakpoint
CREATE INDEX "posts_time_idx" ON "community_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "posts_product_idx" ON "community_posts" USING btree ("tagged_product_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "order_totals_nonnegative" CHECK ("subtotal_kobo" >= 0 AND "delivery_fee_kobo" >= 0 AND "total_kobo" >= 0 AND "discount_kobo" >= 0);