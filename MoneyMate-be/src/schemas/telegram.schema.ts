import { z } from 'zod';
import type { BotIntent, BotOperation, TelegramUpdate } from '../types/telegram.types.ts';
const actor = z.object({
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  is_bot: z.boolean().optional(),
  first_name: z.string().max(256),
  last_name: z.string().max(256).optional(),
  username: z.string().max(64).optional(),
});
const chat = z.object({
  id: z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER),
  type: z.string().max(32),
});
export const telegramUpdateSchema = z.object({
  update_id: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  message: z
    .object({
      message_id: z.number().int(),
      from: actor.optional(),
      chat,
      text: z.string().max(4096).optional(),
      photo: z
        .array(
          z.object({
            file_id: z.string().max(512),
            file_size: z.number().optional(),
            width: z.number(),
            height: z.number(),
          }),
        )
        .max(20)
        .optional(),
    })
    .optional(),
  callback_query: z
    .object({
      id: z.string().max(256),
      from: actor,
      data: z.string().max(64).optional(),
      message: z.object({ message_id: z.number().int(), chat }).optional(),
    })
    .optional(),
}) satisfies z.ZodType<TelegramUpdate>;
const resources = z.enum([
  'transactions',
  'assets',
  'categories',
  'plans',
  'transfers',
  'adjustments',
  'profile',
  'balance',
]);
export const botIntentSchema = z.strictObject({
  action: z.enum([
    'help',
    'list',
    'show',
    'create',
    'update',
    'remove',
    'reconcile',
    'archive',
    'restore',
    'report',
    'cancel',
    'unlink',
    'security',
  ]),
  resource: resources,
  fields: z.record(z.string().max(50), z.string().max(2000)),
  reference: z.string().max(200).optional(),
}) satisfies z.ZodType<BotIntent>;
export const botOperationSchema = z.strictObject({
  action: z.enum(['create', 'update', 'remove', 'reconcile', 'profile', 'unlink']),
  resource: z.enum([
    'transactions',
    'assets',
    'categories',
    'plans',
    'transfers',
    'adjustments',
    'profile',
  ]),
  summary: z.string().max(1500).optional(),
  recordId: z.uuid().optional(),
  input: z.record(z.string(), z.unknown()),
}) satisfies z.ZodType<BotOperation>;
export const telegramConfirmLinkSchema = z.strictObject({
  requestId: z.uuid(),
  telegramUserId: z.string().regex(/^\d+$/).max(20),
});
