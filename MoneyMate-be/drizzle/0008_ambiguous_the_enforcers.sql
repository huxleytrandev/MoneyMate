ALTER TABLE "telegram_links" ADD COLUMN "bot_id" text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "telegram_link_requests" ADD COLUMN "bot_id" text DEFAULT 'legacy' NOT NULL;