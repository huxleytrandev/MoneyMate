import { Router } from 'express';
import type { Database } from '../types/database.types.ts';
import type { TelegramSettings } from '../types/telegram.types.ts';
import { telegramWebhookAuth } from '../middlewares/telegram-auth.middleware.ts';
import { telegramUpdateSchema } from '../schemas/telegram.schema.ts';
import { telegramQueueRepository } from '../repositories/telegram-queue.repository.ts';
export function createTelegramWebhookRoutes(database: Database, settings: TelegramSettings) {
  const router = Router();
  if (settings.mode !== 'webhook' || !settings.token || !settings.webhookSecret) return router;
  router.post(
    '/api/telegram/webhook',
    telegramWebhookAuth(settings.webhookSecret),
    async (request, response) => {
      const result = telegramUpdateSchema.safeParse(request.body);
      if (!result.success) {
        response.sendStatus(400);
        return;
      }
      await telegramQueueRepository(database).receive(settings.token!.split(':')[0], [result.data]);
      response.sendStatus(202);
    },
  );
  return router;
}
