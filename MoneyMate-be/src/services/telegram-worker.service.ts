import { setTimeout as delay } from 'node:timers/promises';
import type { createDatabase } from '../configs/database.ts';
import type { TelegramSettings, TelegramUpdate } from '../types/telegram.types.ts';
import { telegramApi, TelegramApiError } from './telegram-api.service.ts';
import { telegramQueueRepository } from '../repositories/telegram-queue.repository.ts';
import { telegramEngine } from './telegram-engine.service.ts';
import { telegramContext } from '../middlewares/telegram-auth.middleware.ts';
import { telegramUpdateSchema } from '../schemas/telegram.schema.ts';
type DatabaseConnection = ReturnType<typeof createDatabase>;
export async function startTelegramWorker(
  database: DatabaseConnection,
  settings: TelegramSettings,
) {
  if (!settings.token || settings.mode === 'disabled') return async () => {};
  const api = telegramApi(settings);
  const bot = await api.getMe();
  const botId = String(bot.id);
  const leader = await database.pool.connect();
  const locked = await leader.query<{ locked: boolean }>(
    'select pg_try_advisory_lock(hashtextextended($1,0)) as locked',
    ['telegram-worker:' + botId],
  );
  if (!locked.rows[0].locked) {
    leader.release();
    throw new Error('Telegram worker is already running for this bot.');
  }
  const controller = new AbortController();
  const signal = controller.signal;
  const queue = telegramQueueRepository(database.db);
  const engine = telegramEngine(database.db, settings, botId);
  const pause = async (milliseconds: number) => {
    await delay(milliseconds, undefined, { signal }).catch(() => {});
  };
  leader.on('error', () => controller.abort());
  async function poll() {
    while (!signal.aborted) {
      try {
        const updates = await api.call<unknown[]>(
          'getUpdates',
          {
            offset: await queue.offset(botId),
            timeout: 20,
            limit: 30,
            allowed_updates: ['message', 'callback_query'],
          },
          signal,
        );
        const parsed: TelegramUpdate[] = [];
        for (const update of updates) {
          const result = telegramUpdateSchema.safeParse(update);
          if (result.success) parsed.push(result.data);
          else if (
            update &&
            typeof update === 'object' &&
            'update_id' in update &&
            Number.isSafeInteger(update.update_id)
          )
            parsed.push({ update_id: Number(update.update_id) });
        }
        await queue.receive(botId, parsed);
      } catch {
        if (!signal.aborted) {
          console.warn(
            'Telegram polling temporarily unavailable; retrying without logging credentials.',
          );
          await pause(5000);
        }
      }
    }
  }
  async function processInbox() {
    while (!signal.aborted) {
      try {
        const row = await queue.next(botId);
        if (!row) {
          await pause(400);
          continue;
        }
        try {
          await database.db.transaction(async (tx) => {
            const outgoing = await engine.handle(row.payload, tx);
            await queue.complete(tx, botId, row.updateId, outgoing);
          });
        } catch {
          if (row.attempts >= 4) {
            const context = telegramContext(row.payload, botId);
            await database.db.transaction(async (tx) => {
              await queue.complete(
                tx,
                botId,
                row.updateId,
                context
                  ? [
                      {
                        method: 'sendMessage',
                        body: {
                          chat_id: context.identity.chatId,
                          text: 'Không thể hoàn tất yêu cầu sau khi thử lại. Thao tác này chưa được lưu. Hãy dùng /cancel rồi thử lại hoặc kiểm tra trên app.',
                        },
                      },
                    ]
                  : [],
              );
            });
          } else await queue.failed(botId, row.updateId, row.attempts + 1);
          console.warn('Telegram update could not be processed; retry queued.');
        }
      } catch {
        await pause(2000);
      }
    }
  }
  async function sendOutbox() {
    let lastCleanup = 0;
    while (!signal.aborted) {
      try {
        if (Date.now() - lastCleanup > 3600000) {
          await queue.cleanup();
          lastCleanup = Date.now();
        }
        const row = await queue.outgoing(botId);
        if (!row) {
          await pause(400);
          continue;
        }
        if (!(await queue.canDeliver(row.outgoing))) {
          await queue.delivered(row.id);
          continue;
        }
        try {
          await api.call(row.outgoing.method, row.outgoing.body, signal);
          await queue.delivered(row.id);
          await pause(100);
        } catch (error) {
          const failure = error instanceof TelegramApiError ? error : null;
          await queue.retry(
            row.id,
            row.attempts + 1,
            failure?.retryAfter ?? 2 ** row.attempts,
            !!failure && [400, 401, 403].includes(failure.status),
          );
        }
      } catch {
        await pause(2000);
      }
    }
  }
  try {
    const webhook = await api.call<{ url: string }>('getWebhookInfo');
    if (settings.mode === 'polling' && webhook.url)
      throw new Error(
        'Bot already has a webhook. Choose webhook mode or explicitly remove it before polling.',
      );
  } catch (error) {
    await leader.query('select pg_advisory_unlock(hashtextextended($1,0))', [
      'telegram-worker:' + botId,
    ]);
    leader.release();
    throw error;
  }
  const tasks = [processInbox(), sendOutbox(), ...(settings.mode === 'polling' ? [poll()] : [])];
  console.log('Telegram worker ready: @' + bot.username + ' (' + settings.mode + ').');
  return async () => {
    controller.abort();
    await Promise.allSettled(tasks);
    await leader
      .query('select pg_advisory_unlock(hashtextextended($1,0))', ['telegram-worker:' + botId])
      .catch(() => {});
    leader.release();
  };
}
