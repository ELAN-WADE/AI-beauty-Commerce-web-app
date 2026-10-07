ALTER TABLE "content_rewards" ADD COLUMN "reward_bps" integer DEFAULT 200 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_rewards" ADD CONSTRAINT "content_reward_bps_range" CHECK ("reward_bps" BETWEEN 0 AND 5000);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE "content_reward_attributions" (
	"reward_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_reward_attributions_pkey" PRIMARY KEY("reward_id","order_id"),
	CONSTRAINT "content_reward_attribution_order_unique" UNIQUE("order_id")
);--> statement-breakpoint
ALTER TABLE "content_reward_attributions" ADD CONSTRAINT "content_reward_attributions_reward_id_content_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."content_rewards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reward_attributions" ADD CONSTRAINT "content_reward_attributions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;
