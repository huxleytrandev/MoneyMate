CREATE TABLE "telegram_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"source_key" text NOT NULL,
	"operation" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"result_text" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_actions_source_key_unique" UNIQUE("source_key")
);
--> statement-breakpoint
ALTER TABLE "telegram_actions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "telegram_bot_state" (
	"bot_id" text PRIMARY KEY NOT NULL,
	"next_offset" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "telegram_bot_state" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "telegram_conversations" (
	"link_id" uuid PRIMARY KEY NOT NULL,
	"intent" jsonb NOT NULL,
	"awaiting" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "telegram_conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "telegram_inbox" (
	"bot_id" text NOT NULL,
	"update_id" bigint NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_inbox_bot_id_update_id_pk" PRIMARY KEY("bot_id","update_id")
);
--> statement-breakpoint
ALTER TABLE "telegram_inbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "telegram_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"telegram_user_id" text NOT NULL,
	"chat_id" text NOT NULL,
	"username" text,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_links_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "telegram_links_telegram_user_id_unique" UNIQUE("telegram_user_id"),
	CONSTRAINT "telegram_links_chat_id_unique" UNIQUE("chat_id")
);
--> statement-breakpoint
ALTER TABLE "telegram_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "telegram_link_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"telegram_user_id" text,
	"chat_id" text,
	"username" text,
	"display_name" text,
	CONSTRAINT "telegram_link_requests_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "telegram_link_requests_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "telegram_link_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "telegram_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bot_id" text NOT NULL,
	"source_key" text NOT NULL,
	"outgoing" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_outbox_source_key_unique" UNIQUE("source_key")
);
--> statement-breakpoint
ALTER TABLE "telegram_outbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "telegram_actions" ADD CONSTRAINT "telegram_actions_link_id_telegram_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."telegram_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_conversations" ADD CONSTRAINT "telegram_conversations_link_id_telegram_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."telegram_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_links" ADD CONSTRAINT "telegram_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_link_requests" ADD CONSTRAINT "telegram_link_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "telegram_actions_link_idx" ON "telegram_actions" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "telegram_inbox_queue_idx" ON "telegram_inbox" USING btree ("bot_id","status","available_at");--> statement-breakpoint
CREATE INDEX "telegram_outbox_queue_idx" ON "telegram_outbox" USING btree ("bot_id","status","available_at");