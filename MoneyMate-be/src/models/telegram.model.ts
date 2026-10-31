import {
  pgTable,
  uuid,
  text,
  timestamp,
  bigint,
  jsonb,
  integer,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { UserModel } from './user.model.ts';
import type {
  BotIntent,
  BotOperation,
  TelegramUpdate,
  TelegramOutgoing,
} from '../types/telegram.types.ts';
const createdAt = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const expiresAt = () => timestamp('expires_at', { withTimezone: true }).notNull();
export const TelegramLinkModel = pgTable('telegram_links', {
  botId: text('bot_id').notNull().default('legacy'),
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => UserModel.id, { onDelete: 'cascade' }),
  telegramUserId: text('telegram_user_id').notNull().unique(),
  chatId: text('chat_id').notNull().unique(),
  username: text('username'),
  displayName: text('display_name').notNull(),
  createdAt: createdAt(),
}).enableRLS();
export const TelegramLinkRequestModel = pgTable('telegram_link_requests', {
  botId: text('bot_id').notNull().default('legacy'),
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => UserModel.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: expiresAt(),
  createdAt: createdAt(),
  telegramUserId: text('telegram_user_id'),
  chatId: text('chat_id'),
  username: text('username'),
  displayName: text('display_name'),
}).enableRLS();
export const TelegramConversationModel = pgTable('telegram_conversations', {
  linkId: uuid('link_id')
    .primaryKey()
    .references(() => TelegramLinkModel.id, { onDelete: 'cascade' }),
  intent: jsonb('intent').$type<BotIntent>().notNull(),
  awaiting: text('awaiting').notNull(),
  expiresAt: expiresAt(),
}).enableRLS();
export const TelegramActionModel = pgTable(
  'telegram_actions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    linkId: uuid('link_id')
      .notNull()
      .references(() => TelegramLinkModel.id, { onDelete: 'cascade' }),
    sourceKey: text('source_key').notNull().unique(),
    operation: jsonb('operation').$type<BotOperation>().notNull(),
    status: text('status').notNull().default('pending'),
    resultText: text('result_text'),
    expiresAt: expiresAt(),
    createdAt: createdAt(),
  },
  (table) => [index('telegram_actions_link_idx').on(table.linkId)],
).enableRLS();
export const TelegramInboxModel = pgTable(
  'telegram_inbox',
  {
    userId: uuid('user_id').references(() => UserModel.id, { onDelete: 'cascade' }),
    botId: text('bot_id').notNull(),
    updateId: bigint('update_id', { mode: 'number' }).notNull(),
    payload: jsonb('payload').$type<TelegramUpdate>().notNull(),
    status: text('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    availableAt: timestamp('available_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.botId, table.updateId] }),
    index('telegram_inbox_queue_idx').on(table.botId, table.status, table.availableAt),
    index('telegram_inbox_recent_idx').on(table.botId, table.createdAt),
    index('telegram_inbox_user_idx').on(table.userId),
  ],
).enableRLS();
export const TelegramOutboxModel = pgTable(
  'telegram_outbox',
  {
    userId: uuid('user_id').references(() => UserModel.id, { onDelete: 'cascade' }),
    id: uuid('id').defaultRandom().primaryKey(),
    botId: text('bot_id').notNull(),
    sourceKey: text('source_key').notNull().unique(),
    outgoing: jsonb('outgoing').$type<TelegramOutgoing>().notNull(),
    status: text('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    availableAt: timestamp('available_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (table) => [
    index('telegram_outbox_queue_idx').on(table.botId, table.status, table.availableAt),
    index('telegram_outbox_user_idx').on(table.userId),
  ],
).enableRLS();
export const TelegramBotStateModel = pgTable('telegram_bot_state', {
  botId: text('bot_id').primaryKey(),
  nextOffset: bigint('next_offset', { mode: 'number' }).notNull().default(0),
}).enableRLS();
