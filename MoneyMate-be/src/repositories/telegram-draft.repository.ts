import { and, eq, gt, sql } from 'drizzle-orm';
import { TelegramActionModel, TelegramConversationModel } from '../models/telegram.model.ts';
import { TELEGRAM } from '../constants/telegram.constant.ts';
import type { Executor } from '../types/database.types.ts';
import type { BotIntent, BotOperation } from '../types/telegram.types.ts';
export function telegramDraftRepository(db: Executor) {
  return {
    conversation: async (linkId: string) =>
      (
        await db
          .select()
          .from(TelegramConversationModel)
          .where(
            and(
              eq(TelegramConversationModel.linkId, linkId),
              gt(TelegramConversationModel.expiresAt, new Date()),
            ),
          )
      )[0],
    remember: (linkId: string, intent: BotIntent, awaiting: string) =>
      db
        .insert(TelegramConversationModel)
        .values({ linkId, intent, awaiting, expiresAt: new Date(Date.now() + TELEGRAM.draftMs) })
        .onConflictDoUpdate({
          target: TelegramConversationModel.linkId,
          set: { intent, awaiting, expiresAt: new Date(Date.now() + TELEGRAM.draftMs) },
        }),
    forget: (linkId: string) =>
      db.delete(TelegramConversationModel).where(eq(TelegramConversationModel.linkId, linkId)),
    stage: async (linkId: string, sourceKey: string, operation: BotOperation) => {
      const existing = (
        await db
          .select()
          .from(TelegramActionModel)
          .where(eq(TelegramActionModel.sourceKey, sourceKey))
      )[0];
      if (existing) return existing;
      await db
        .update(TelegramActionModel)
        .set({ status: 'cancelled' })
        .where(
          and(eq(TelegramActionModel.linkId, linkId), eq(TelegramActionModel.status, 'pending')),
        );
      return (
        await db
          .insert(TelegramActionModel)
          .values({
            linkId,
            sourceKey,
            operation,
            expiresAt: new Date(Date.now() + TELEGRAM.draftMs),
          })
          .returning()
      )[0];
    },
    lockedAction: async (id: string, linkId: string) =>
      (
        await db
          .select()
          .from(TelegramActionModel)
          .where(and(eq(TelegramActionModel.id, id), eq(TelegramActionModel.linkId, linkId)))
          .for('update')
      )[0],
    complete: (id: string, text: string) =>
      db
        .update(TelegramActionModel)
        .set({ status: 'completed', resultText: text })
        .where(eq(TelegramActionModel.id, id)),
    cancel: (linkId: string) =>
      db
        .update(TelegramActionModel)
        .set({ status: 'cancelled' })
        .where(
          and(eq(TelegramActionModel.linkId, linkId), eq(TelegramActionModel.status, 'pending')),
        ),
    recent: async (botId: string, actor: string) => {
      const result = await db.execute<{ count: number }>(
        sql`select count(*)::int as count from telegram_inbox where bot_id=${botId} and created_at > now()-interval '1 minute' and coalesce(payload->'message'->'from'->>'id',payload->'callback_query'->'from'->>'id')=${actor}`,
      );
      return result.rows[0].count;
    },
  };
}
