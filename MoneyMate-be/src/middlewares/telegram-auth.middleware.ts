import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import type { TelegramContext, TelegramUpdate } from '../types/telegram.types.ts';
export function telegramWebhookAuth(secret: string): RequestHandler {
  return (request, response, next) => {
    const supplied = request.get('X-Telegram-Bot-Api-Secret-Token') ?? '';
    const hash = (value: string) => createHash('sha256').update(value).digest();
    if (!supplied || !timingSafeEqual(hash(supplied), hash(secret))) {
      response.sendStatus(403);
      return;
    }
    next();
  };
}
export function telegramContext(update: TelegramUpdate, botId: string): TelegramContext | null {
  const actor = update.callback_query?.from ?? update.message?.from;
  const chat = update.callback_query?.message?.chat ?? update.message?.chat;
  if (!actor || actor.is_bot || !chat || chat.type !== 'private' || chat.id !== actor.id)
    return null;
  return {
    identity: {
      botId,
      telegramUserId: String(actor.id),
      chatId: String(chat.id),
      username: actor.username ?? null,
      displayName: [actor.first_name, actor.last_name].filter(Boolean).join(' '),
    },
    update,
    text: update.message?.text?.trim() ?? '',
    callback: update.callback_query?.data,
    sourceKey: botId + ':' + update.update_id,
  };
}
