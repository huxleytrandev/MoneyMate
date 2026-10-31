import { and, eq, gt, isNull } from 'drizzle-orm';
import { TelegramLinkModel, TelegramLinkRequestModel } from '../models/telegram.model.ts';
import type { Executor } from '../types/database.types.ts';
import type { TelegramIdentity } from '../types/telegram.types.ts';
export function telegramLinkRepository(db: Executor) {
  return {
    byUser: async (userId: string) =>
      (await db.select().from(TelegramLinkModel).where(eq(TelegramLinkModel.userId, userId)))[0],
    byTelegram: async (identity: TelegramIdentity) =>
      (
        await db
          .select()
          .from(TelegramLinkModel)
          .where(
            and(
              eq(TelegramLinkModel.botId, identity.botId),
              eq(TelegramLinkModel.telegramUserId, identity.telegramUserId),
              eq(TelegramLinkModel.chatId, identity.chatId),
            ),
          )
      )[0],
    request: async (userId: string) =>
      (
        await db
          .select()
          .from(TelegramLinkRequestModel)
          .where(
            and(
              eq(TelegramLinkRequestModel.userId, userId),
              gt(TelegramLinkRequestModel.expiresAt, new Date()),
            ),
          )
      )[0],
    issue: async (data: typeof TelegramLinkRequestModel.$inferInsert) =>
      (
        await db
          .insert(TelegramLinkRequestModel)
          .values(data)
          .onConflictDoUpdate({
            target: TelegramLinkRequestModel.userId,
            set: { ...data, telegramUserId: null, chatId: null, username: null, displayName: null },
          })
          .returning()
      )[0],
    claim: async (tokenHash: string, identity: TelegramIdentity) =>
      (
        await db
          .update(TelegramLinkRequestModel)
          .set(identity)
          .where(
            and(
              eq(TelegramLinkRequestModel.botId, identity.botId),
              eq(TelegramLinkRequestModel.tokenHash, tokenHash),
              gt(TelegramLinkRequestModel.expiresAt, new Date()),
              isNull(TelegramLinkRequestModel.telegramUserId),
            ),
          )
          .returning()
      )[0],
    insert: async (data: typeof TelegramLinkModel.$inferInsert) =>
      (await db.insert(TelegramLinkModel).values(data).returning())[0],
    revoke: (userId: string) =>
      db.delete(TelegramLinkModel).where(eq(TelegramLinkModel.userId, userId)),
    removeRequest: (userId: string) =>
      db.delete(TelegramLinkRequestModel).where(eq(TelegramLinkRequestModel.userId, userId)),
  };
}
