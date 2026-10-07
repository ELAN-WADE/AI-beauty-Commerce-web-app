ALTER TABLE "community_posts" ADD COLUMN "creator_id" uuid;--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "reward_eligible" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX "posts_creator_idx" ON "community_posts" USING btree ("creator_id");--> statement-breakpoint
CREATE TABLE "content_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"window_end" timestamp with time zone NOT NULL,
	"orders_attributed" integer DEFAULT 0 NOT NULL,
	"merchandise_kobo" bigint DEFAULT 0 NOT NULL,
	"amount_kobo" bigint NOT NULL,
	"reversed_kobo" bigint DEFAULT 0 NOT NULL,
	"hold_days" integer DEFAULT 14 NOT NULL,
	"released_at" timestamp with time zone,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_reward_post_window_unique" UNIQUE("post_id","window_start"),
	CONSTRAINT "content_reward_window_ordered" CHECK ("window_end" > "window_start"),
	CONSTRAINT "content_reward_amount_positive" CHECK ("amount_kobo" > 0 AND "amount_kobo" <= 9007199254740991),
	CONSTRAINT "content_reward_reversal_bounds" CHECK ("reversed_kobo" >= 0 AND "reversed_kobo" <= "amount_kobo"),
	CONSTRAINT "content_reward_counts_nonnegative" CHECK ("orders_attributed" >= 0 AND "merchandise_kobo" >= 0)
);--> statement-breakpoint
ALTER TABLE "content_rewards" ADD CONSTRAINT "content_rewards_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_rewards" ADD CONSTRAINT "content_rewards_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_rewards" ADD CONSTRAINT "content_rewards_wallet_id_wallet_accounts_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_reward_wallet_idx" ON "content_rewards" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "content_reward_creator_idx" ON "content_rewards" USING btree ("creator_id");
