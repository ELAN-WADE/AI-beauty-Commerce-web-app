CREATE TABLE "analysis_results" (
	"analysis_id" uuid PRIMARY KEY NOT NULL,
	"skin_type" text DEFAULT '' NOT NULL,
	"concerns" text[] DEFAULT '{}' NOT NULL,
	"hydration" integer DEFAULT 50 NOT NULL,
	"oiliness" integer DEFAULT 50 NOT NULL,
	"sensitivity" integer DEFAULT 50 NOT NULL,
	"texture" integer DEFAULT 50 NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metrics_range" CHECK ("hydration" BETWEEN 0 AND 100 AND "oiliness" BETWEEN 0 AND 100 AND "sensitivity" BETWEEN 0 AND 100 AND "texture" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "skin_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"consent_accepted" boolean NOT NULL,
	"consent_version" text DEFAULT '' NOT NULL,
	"image_key" text,
	"image_mime" text,
	"image_bytes" integer,
	"error" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analysis_status_allowed" CHECK ("status" IN ('pending','processing','complete','failed'))
);
--> statement-breakpoint
CREATE TABLE "skin_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"skin_type" text DEFAULT '' NOT NULL,
	"concerns" text[] DEFAULT '{}' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT 'Consultation' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"grounded_slugs" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_role_allowed" CHECK ("role" IN ('user','assistant'))
);
--> statement-breakpoint
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_analysis_id_skin_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."skin_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skin_analyses" ADD CONSTRAINT "skin_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skin_profiles" ADD CONSTRAINT "skin_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analyses_user_time_idx" ON "skin_analyses" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "conversations_user_time_idx" ON "ai_conversations" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "ai_messages" USING btree ("conversation_id","created_at");