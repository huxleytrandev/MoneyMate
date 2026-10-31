import { createHash } from 'node:crypto';
import { and, eq, sql, lt } from 'drizzle-orm';
import {
  TelegramInboxModel,
  TelegramOutboxModel,
  TelegramBotStateModel,
  TelegramLinkModel,
  TelegramActionModel,
  TelegramConversationModel,
  TelegramLinkRequestModel,
} from '../models/telegram.model.ts';
import type { Database, DatabaseTransaction } from '../types/database.types.ts';
import type { TelegramOutgoing, TelegramUpdate } from '../types/telegram.types.ts';
function persistedUpdate(update: TelegramUpdate): TelegramUpdate {
  const match = update.message?.text?.match(/^\/start(?:@\w+)?\s+([A-Za-z0-9_-]{43})(?:\s|$)/);
  if (!match || !update.message) return update;
  const hash = createHash('sha256').update(match[1]).digest('hex');
  return { ...update, message: { ...update.message, text: '/start_digest ' + hash } };
}
export function telegramQueueRepository(database: Database) {
  function owner(botId: string, update: TelegramUpdate) {
    const actor = update.callback_query?.from ?? update.message?.from;
    const chat = update.callback_query?.message?.chat ?? update.message?.chat;
    if (!actor || actor.is_bot || chat?.type !== 'private' || chat.id !== actor.id) return null;
    const hash = persistedUpdate(update).message?.text?.match(
      /^\/start_digest ([a-f0-9]{64})$/,
    )?.[1];
    return sql<string>`(select user_id from telegram_links where bot_id=${botId} and telegram_user_id=${String(actor.id)} and chat_id=${String(chat.id)}
      union all select user_id from telegram_link_requests where bot_id=${botId} and token_hash=${hash ?? ''} and expires_at>now() limit 1)`;
  }
  async function receive(botId: string, updates: TelegramUpdate[]) {
    if (!updates.length) return;
    await database.transaction(async (tx) => {
      await tx
        .insert(TelegramInboxModel)
        .values(
          updates.map((payload) => ({
            botId,
            userId: owner(botId, payload),
            updateId: payload.update_id,
            payload: persistedUpdate(payload),
          })),
        )
        .onConflictDoNothing();
      const nextOffset = Math.max(...updates.map((update) => update.update_id)) + 1;
      await tx
        .insert(TelegramBotStateModel)
        .values({ botId, nextOffset })
        .onConflictDoUpdate({
          target: TelegramBotStateModel.botId,
          set: { nextOffset: sql`greatest(telegram_bot_state.next_offset,${nextOffset})` },
        });
    });
  }
  async function offset(botId: string) {
    return (
      (
        await database
          .select()
          .from(TelegramBotStateModel)
          .where(eq(TelegramBotStateModel.botId, botId))
      )[0]?.nextOffset ?? 0
    );
  }
  async function next(botId: string) {
    return (
      await database
        .select()
        .from(TelegramInboxModel)
        .where(
          and(
            eq(TelegramInboxModel.botId, botId),
            eq(TelegramInboxModel.status, 'pending'),
            sql`available_at <= now()`,
          ),
        )
        .orderBy(TelegramInboxModel.updateId)
        .limit(1)
    )[0];
  }
  async function complete(
    tx: DatabaseTransaction,
    botId: string,
    updateId: number,
    outgoing: TelegramOutgoing[],
  ) {
    if (outgoing.length)
      await tx
        .insert(TelegramOutboxModel)
        .values(
          outgoing.map((entry, index) => ({
            botId,
            userId: sql`(select user_id from telegram_inbox where bot_id=${botId} and update_id=${updateId})`,
            sourceKey: botId + ':' + updateId + ':' + index,
            outgoing: entry,
          })),
        )
        .onConflictDoNothing();
    await tx
      .update(TelegramInboxModel)
      .set({ status: 'completed' })
      .where(and(eq(TelegramInboxModel.botId, botId), eq(TelegramInboxModel.updateId, updateId)));
  }
  async function failed(botId: string, updateId: number, attempts: number) {
    await database
      .update(TelegramInboxModel)
      .set({
        attempts,
        availableAt: new Date(Date.now() + Math.min(60000, 1000 * 2 ** attempts)),
        status: attempts >= 5 ? 'failed' : 'pending',
      })
      .where(and(eq(TelegramInboxModel.botId, botId), eq(TelegramInboxModel.updateId, updateId)));
  }
  async function outgoing(botId: string) {
    return (
      await database
        .select()
        .from(TelegramOutboxModel)
        .where(
          and(
            eq(TelegramOutboxModel.botId, botId),
            eq(TelegramOutboxModel.status, 'pending'),
            sql`available_at <= now()`,
          ),
        )
        .orderBy(TelegramOutboxModel.createdAt)
        .limit(1)
    )[0];
  }
  async function delivered(id: string) {
    await database
      .update(TelegramOutboxModel)
      .set({ status: 'sent' })
      .where(eq(TelegramOutboxModel.id, id));
  }
  async function retry(id: string, attempts: number, seconds: number, permanent: boolean) {
    await database
      .update(TelegramOutboxModel)
      .set({
        attempts,
        status: permanent || attempts >= 8 ? 'failed' : 'pending',
        availableAt: new Date(Date.now() + Math.max(1, Math.min(seconds, 3600)) * 1000),
      })
      .where(eq(TelegramOutboxModel.id, id));
  }
  async function canDeliver(outgoing: TelegramOutgoing) {
    if (!outgoing.guardLinkId) return true;
    return !!(
      await database
        .select({ id: TelegramLinkModel.id })
        .from(TelegramLinkModel)
        .where(
          and(
            eq(TelegramLinkModel.id, outgoing.guardLinkId),
            eq(TelegramLinkModel.chatId, String(outgoing.body.chat_id)),
          ),
        )
        .limit(1)
    )[0];
  }
  async function cleanup() {
    const yesterday = new Date(Date.now() - 86400000),
      week = new Date(Date.now() - 7 * 86400000);
    await database
      .delete(TelegramLinkRequestModel)
      .where(lt(TelegramLinkRequestModel.expiresAt, new Date()));
    await database
      .delete(TelegramConversationModel)
      .where(lt(TelegramConversationModel.expiresAt, new Date()));
    await database.delete(TelegramActionModel).where(lt(TelegramActionModel.createdAt, week));
    await database
      .delete(TelegramInboxModel)
      .where(and(lt(TelegramInboxModel.createdAt, week), sql`status <> 'pending'`));
    await database
      .delete(TelegramOutboxModel)
      .where(and(lt(TelegramOutboxModel.createdAt, yesterday), sql`status <> 'pending'`));
  }
  return {
    receive,
    offset,
    next,
    complete,
    failed,
    outgoing,
    delivered,
    retry,
    canDeliver,
    cleanup,
  };
}
