CREATE INDEX "telegram_inbox_user_idx" ON "telegram_inbox" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "telegram_outbox_user_idx" ON "telegram_outbox" USING btree ("user_id");