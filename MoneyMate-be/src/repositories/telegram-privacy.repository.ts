import { eq, sql } from 'drizzle-orm';
import type { DatabaseTransaction } from '../types/database.types.ts';
import { TelegramInboxModel, TelegramOutboxModel } from '../models/telegram.model.ts';
export function telegramPrivacyRepository(transaction: DatabaseTransaction) {
  async function removeAccountCopies(userId: string) {
    await transaction.delete(TelegramOutboxModel).where(eq(TelegramOutboxModel.userId, userId));
    await transaction.delete(TelegramInboxModel).where(eq(TelegramInboxModel.userId, userId));
    // Legacy rows can only be attributed using an existing verified link.
    await transaction.execute(
      sql`delete from telegram_outbox q using telegram_links l where l.user_id=${userId}::uuid and q.user_id is null and q.bot_id=l.bot_id and (q.outgoing->>'guardLinkId'=l.id::text or q.outgoing->'body'->>'chat_id'=l.chat_id)`,
    );
    await transaction.execute(
      sql`delete from telegram_inbox q using telegram_links l where l.user_id=${userId}::uuid and q.user_id is null and q.bot_id=l.bot_id and coalesce(q.payload->'message'->'from'->>'id',q.payload->'callback_query'->'from'->>'id')=l.telegram_user_id and coalesce(q.payload->'message'->'chat'->>'id',q.payload->'callback_query'->'message'->'chat'->>'id')=l.chat_id`,
    );
  }
  return { removeAccountCopies };
}
