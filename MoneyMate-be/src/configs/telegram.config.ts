import { z } from 'zod';
import type { TelegramSettings } from '../types/telegram.types.ts';
export function telegramSettings(environment: NodeJS.ProcessEnv = process.env): TelegramSettings {
  const result = z
    .object({
      TELEGRAM_BOT_TOKEN: z
        .string()
        .regex(/^\d+:[A-Za-z0-9_-]{20,}$/)
        .optional(),
      TELEGRAM_MODE: z.enum(['polling', 'webhook', 'disabled']).default('polling'),
      TELEGRAM_WEBHOOK_SECRET: z
        .string()
        .regex(/^[A-Za-z0-9_-]{32,256}$/)
        .optional(),
      TELEGRAM_PUBLIC_URL: z.url().optional(),
      AI_SERVICE_URL: z.url().default('http://127.0.0.1:3001'),
      AI_SERVICE_TOKEN: z.string().min(32).optional(),
    })
    .safeParse(environment);
  if (!result.success)
    throw new Error(
      'Invalid Telegram/AI configuration: ' +
        result.error.issues.map((issue) => issue.path.join('.')).join(', '),
    );
  const config = result.data;
  if (
    config.TELEGRAM_MODE === 'webhook' &&
    (!config.TELEGRAM_WEBHOOK_SECRET || !config.TELEGRAM_PUBLIC_URL?.startsWith('https://'))
  )
    throw new Error('Telegram webhook requires HTTPS public URL and a 32+ character secret.');
  return {
    token: config.TELEGRAM_BOT_TOKEN,
    mode: config.TELEGRAM_MODE,
    webhookSecret: config.TELEGRAM_WEBHOOK_SECRET,
    publicUrl: config.TELEGRAM_PUBLIC_URL,
    aiUrl: config.AI_SERVICE_URL.replace(/\/$/, ''),
    aiToken: config.AI_SERVICE_TOKEN,
  };
}
