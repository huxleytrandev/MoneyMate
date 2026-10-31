ALTER TABLE "telegram_inbox" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "telegram_outbox" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "telegram_inbox" ADD CONSTRAINT "telegram_inbox_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_outbox" ADD CONSTRAINT "telegram_outbox_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
UPDATE telegram_inbox q SET user_id=l.user_id FROM telegram_links l
WHERE q.user_id IS NULL AND q.bot_id=l.bot_id
AND coalesce(q.payload->'message'->'from'->>'id',q.payload->'callback_query'->'from'->>'id')=l.telegram_user_id
AND coalesce(q.payload->'message'->'chat'->>'id',q.payload->'callback_query'->'message'->'chat'->>'id')=l.chat_id;
--> statement-breakpoint
UPDATE telegram_outbox q SET user_id=l.user_id FROM telegram_links l
WHERE q.user_id IS NULL AND q.bot_id=l.bot_id
AND (q.outgoing->>'guardLinkId'=l.id::text OR q.outgoing->'body'->>'chat_id'=l.chat_id);
--> statement-breakpoint
UPDATE telegram_outbox q SET user_id=i.user_id FROM telegram_inbox i
WHERE q.user_id IS NULL AND i.user_id IS NOT NULL AND q.bot_id=i.bot_id
AND split_part(q.source_key,':',1)=i.bot_id AND split_part(q.source_key,':',2)=i.update_id::text;
