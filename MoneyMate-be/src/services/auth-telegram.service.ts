import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Executor, Database } from '../types/database.types.ts';
import type { TelegramIdentity, TelegramSettings } from '../types/telegram.types.ts';
import { telegramLinkRepository } from '../repositories/telegram-link.repository.ts';
import { withUserWrite } from '../repositories/finance.repository.ts';
import { telegramConfirmLinkSchema } from '../schemas/telegram.schema.ts';
import { telegramApi } from './telegram-api.service.ts';
import { AppError } from '../utils/app-error.ts';
import { TELEGRAM } from '../constants/telegram.constant.ts';
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
export function authTelegramService(database: Database, settings: TelegramSettings) {
  const links = telegramLinkRepository(database);
  const api = telegramApi(settings);
  async function status(userId: string) {
    const [link, request] = await Promise.all([links.byUser(userId), links.request(userId)]);
    return {
      enabled: !!settings.token && settings.mode !== 'disabled',
      link:
        link && link.botId === settings.token?.split(':')[0]
          ? {
              username: link.username,
              telegramUserId: link.telegramUserId,
              displayName: link.displayName,
              linkedAt: link.createdAt,
            }
          : null,
      request:
        request && request.botId === settings.token?.split(':')[0]
          ? {
              id: request.id,
              expiresAt: request.expiresAt,
              candidate: request.telegramUserId
                ? {
                    telegramUserId: request.telegramUserId,
                    username: request.username,
                    displayName: request.displayName,
                  }
                : null,
            }
          : null,
    };
  }
  async function issue(userId: string) {
    if (!settings.token || settings.mode === 'disabled')
      throw new AppError(503, 'Telegram chưa được bật.');
    const bot = await api.getMe();
    const token = randomBytes(32).toString('base64url');
    const request = await withUserWrite(database, userId, (tx) =>
      telegramLinkRepository(tx).issue({
        id: randomUUID(),
        botId: String(bot.id),
        userId,
        tokenHash: digest(token),
        expiresAt: new Date(Date.now() + TELEGRAM.linkMs),
      }),
    );
    return {
      url: 'https://t.me/' + bot.username + '?start=' + token,
      expiresAt: request.expiresAt,
    };
  }
  async function claim(token: string, identity: TelegramIdentity, executor: Executor = database) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
    return claimDigest(digest(token), identity, executor);
  }
  async function claimDigest(
    hash: string,
    identity: TelegramIdentity,
    executor: Executor = database,
  ) {
    if (!/^[a-f0-9]{64}$/.test(hash)) return false;
    return !!(await telegramLinkRepository(executor).claim(hash, identity));
  }
  async function confirm(userId: string, body: unknown) {
    const input = telegramConfirmLinkSchema.parse(body);
    return withUserWrite(database, userId, async (tx) => {
      const repository = telegramLinkRepository(tx);
      const request = await repository.request(userId);
      if (
        !request ||
        request.id !== input.requestId ||
        (!!settings.token && request.botId !== settings.token.split(':')[0]) ||
        request.telegramUserId !== input.telegramUserId ||
        !request.chatId ||
        !request.displayName
      )
        throw new AppError(409, 'Yêu cầu liên kết không hợp lệ hoặc đã hết hạn.');
      await repository.revoke(userId);
      await repository.insert({
        userId,
        botId: request.botId,
        telegramUserId: request.telegramUserId,
        chatId: request.chatId,
        username: request.username,
        displayName: request.displayName,
      });
      await repository.removeRequest(userId);
      return { linked: true };
    });
  }
  async function revoke(userId: string) {
    await withUserWrite(database, userId, async (tx) => {
      const repository = telegramLinkRepository(tx);
      await repository.revoke(userId);
      await repository.removeRequest(userId);
    });
  }
  return { status, issue, claim, claimDigest, confirm, revoke };
}
