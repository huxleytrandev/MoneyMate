import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';
import { createHash, randomUUID } from 'node:crypto';
import express from 'express';
import { once } from 'node:events';
import {
  telegramContext,
  telegramWebhookAuth,
} from '../src/middlewares/telegram-auth.middleware.ts';
import { telegramUpdateSchema, botIntentSchema } from '../src/schemas/telegram.schema.ts';
import { botMoney, botTimestamp, fieldValue } from '../src/utils/telegram-input.ts';
import { telegramApi, TelegramApiError } from '../src/services/telegram-api.service.ts';
import { telegramSettings } from '../src/configs/telegram.config.ts';
import { createDatabase } from '../src/configs/database.ts';
import { loadEnvironment } from '../src/configs/environment.ts';
import {
  UserModel,
  AssetAccountModel,
  CategoryModel,
  TransactionModel,
  TelegramLinkModel,
  TelegramLinkRequestModel,
  TelegramInboxModel,
} from '../src/models/index.ts';
import { authTelegramService } from '../src/services/auth-telegram.service.ts';
import { telegramDraftRepository } from '../src/repositories/telegram-draft.repository.ts';
import { telegramQueueRepository } from '../src/repositories/telegram-queue.repository.ts';
import { telegramActionService } from '../src/services/telegram-action.service.ts';
import { telegramEngine } from '../src/services/telegram-engine.service.ts';
import { telegramFormService } from '../src/services/telegram-form.service.ts';
import { eq } from 'drizzle-orm';
import { telegramReadService } from '../src/services/telegram-read.service.ts';
import type {
  TelegramIdentity,
  TelegramSettings,
  TelegramUpdate,
} from '../src/types/telegram.types.ts';
const settings: TelegramSettings = { mode: 'disabled', aiUrl: 'http://127.0.0.1:1' };
const update = (id = 123): TelegramUpdate => ({
  update_id: 100,
  message: {
    message_id: 1,
    from: { id, first_name: 'Fixture' },
    chat: { id, type: 'private' },
    text: 'hello',
  },
});
test('only private sender identity is accepted; usernames never authorize a user', () => {
  const value = update();
  assert.equal(telegramContext(value, 'bot')?.identity.telegramUserId, '123');
  assert.equal(
    telegramContext(
      { ...value, message: { ...value.message!, chat: { id: -1, type: 'group' } } },
      'bot',
    ),
    null,
  );
  assert.equal(
    telegramContext(
      { ...value, message: { ...value.message!, chat: { id: 456, type: 'private' } } },
      'bot',
    ),
    null,
  );
  assert.equal(telegramUpdateSchema.safeParse({ update_id: NaN }).success, false);
  assert.equal(
    botIntentSchema.safeParse({ action: 'execute_sql', resource: 'transactions', fields: {} })
      .success,
    false,
  );
});
test('Telegram input validates money, dates, hours and nonexistent timezone times', () => {
  assert.equal(botMoney('1,5tr'), '1500000');
  assert.equal(botMoney('1.250.000'), '1250000');
  assert.equal(botMoney('1,2'), null);
  assert.equal(botTimestamp('2026-10-31', '12:30', 'Asia/Ho_Chi_Minh'), '2026-10-31T05:30:00.000Z');
  assert.throws(() => botTimestamp('2026-02-30', '12:30', 'Asia/Ho_Chi_Minh'));
  assert.throws(() => botTimestamp('2026-10-31', '24:00', 'Asia/Ho_Chi_Minh'));
  assert.throws(() => botTimestamp('2026-03-08', '02:30', 'America/New_York'));
  assert.throws(() => fieldValue('gender', 'admin'));
  assert.throws(() => fieldValue('month', '2026-13'));
});
test('webhook requires exact secret; errors never expose token-containing request URLs', async () => {
  const app = express();
  app.post('/', telegramWebhookAuth('a'.repeat(32)), (_request, response) => {
    response.sendStatus(202);
  });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const url = 'http://127.0.0.1:' + address.port;
    assert.equal((await fetch(url, { method: 'POST' })).status, 403);
    assert.equal(
      (
        await fetch(url, {
          method: 'POST',
          headers: { 'X-Telegram-Bot-Api-Secret-Token': 'a'.repeat(32) },
        })
      ).status,
      202,
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  const previous = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('https://api.telegram.org/botSECRET/getMe');
  };
  try {
    await assert.rejects(
      telegramApi({ ...settings, token: 'test-only-token' }).getMe(),
      (error: unknown) => error instanceof TelegramApiError && !error.message.includes('SECRET'),
    );
  } finally {
    globalThis.fetch = previous;
  }
  assert.throws(() => telegramSettings({ TELEGRAM_MODE: 'webhook' }));
});
test(
  'Telegram grants, idempotent confirmations, ownership, revocation, durable inbox and guided CRUD',
  { skip: process.env.RUN_DB_TESTS !== '1', timeout: 120000 },
  async () => {
    const database = createDatabase(
      { ...loadEnvironment(), DB_CONNECTION_TIMEOUT_MS: 30000 },
      { queryTimeoutMs: 30000 },
    );
    const userId = randomUUID(),
      otherId = randomUUID(),
      assetId = randomUUID(),
      categoryId = randomUUID();
    const actorId = String(500000000 + Math.floor(Math.random() * 100000000));
    const identity: TelegramIdentity = {
      botId: 'fixture-' + userId,
      telegramUserId: actorId,
      chatId: actorId,
      username: 'fixture',
      displayName: 'Fixture',
    };
    const requestId = randomUUID();
    const token = 'x'.repeat(43);
    try {
      await database.db.insert(UserModel).values([
        {
          id: userId,
          email: 'telegram-test-' + userId + '@example.invalid',
          displayName: 'Telegram fixture',
        },
        {
          id: otherId,
          email: 'telegram-other-' + otherId + '@example.invalid',
          displayName: 'Other fixture',
        },
      ]);
      await database.db.insert(AssetAccountModel).values({
        id: assetId,
        userId,
        name: 'Tiền mặt',
        type: 'cash',
        openingValue: 1000000n,
        openingAt: '2020-01-01T00:00:00Z',
      });
      await database.db
        .insert(CategoryModel)
        .values({ id: categoryId, userId, name: 'Ăn uống', kind: 'expense' });
      await database.db.insert(TelegramLinkRequestModel).values({
        id: requestId,
        botId: identity.botId,
        userId,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(Date.now() + 60000),
      });
      const auth = authTelegramService(database.db, settings);
      assert.equal(await auth.claim(token, identity), true);
      assert.equal((await auth.status(userId)).link, null);
      assert.equal(await auth.claim(token, identity), false);
      await assert.rejects(auth.confirm(otherId, { requestId, telegramUserId: actorId }));
      await auth.confirm(userId, { requestId, telegramUserId: actorId });
      const link = (
        await database.db
          .select()
          .from(TelegramLinkModel)
          .where(eq(TelegramLinkModel.userId, userId))
      )[0];
      assert.ok(link);
      const drafts = telegramDraftRepository(database.db);
      const action = await drafts.stage(link.id, 'test-' + randomUUID(), {
        action: 'create',
        resource: 'transactions',
        input: {
          id: randomUUID(),
          title: 'Lunch',
          kind: 'expense',
          categoryId,
          amount: '50000',
          occurredAt: new Date().toISOString(),
          allocations: [{ assetAccountId: assetId, amount: '50000' }],
        },
      });
      const service = telegramActionService(database.db);
      const results = await Promise.all([
        service.confirm(identity, action.id),
        service.confirm(identity, action.id),
      ]);
      assert.equal(results[0], results[1]);
      assert.equal(
        (
          await database.db
            .select()
            .from(TransactionModel)
            .where(eq(TransactionModel.userId, userId))
        ).length,
        1,
      );
      await assert.rejects(
        service.confirm({ ...identity, telegramUserId: '999', chatId: '999' }, action.id),
      );
      const stale = await drafts.stage(link.id, 'stale-' + randomUUID(), {
        action: 'update',
        resource: 'assets',
        recordId: assetId,
        input: {
          name: 'Cash',
          type: 'cash',
          openingValue: '1000000',
          openingAt: '2020-01-01T00:00:00Z',
          version: 1,
        },
      });
      await assert.rejects(service.confirm(identity, stale.id));
      const user = { id: userId, timezone: 'Asia/Ho_Chi_Minh' };
      const forms = telegramFormService(database.db);
      const preview = await forms.prepare(
        link,
        user,
        {
          action: 'create',
          resource: 'transactions',
          fields: {
            kind: 'expense',
            title: 'Dinner',
            amount: '30000',
            category: 'an uong',
            asset: 'tien mat',
          },
        },
        'form-' + randomUUID(),
      );
      assert.match(preview.text, /Xác nhận/);
      assert.ok(preview.buttons?.[0][0].callback_data?.startsWith('confirm:'));
      // Exercise the same preview/confirmation path for every financial resource.
      async function commitIntent(intent: Parameters<typeof forms.prepare>[2]) {
        const reply = await forms.prepare(link!, user, intent, 'crud-' + randomUUID());
        const callback = reply.buttons
          ?.flat()
          .find((button) => button.callback_data?.startsWith('confirm:'))?.callback_data;
        assert.ok(callback, reply.text);
        await service.confirm(identity, callback.slice(8));
        return (await drafts.lockedAction(callback.slice(8), link!.id))!.operation;
      }
      await assert.rejects(service.confirm({ ...identity, botId: 'another-bot' }, action.id));
      const assetOperation = await commitIntent({
        action: 'create',
        resource: 'assets',
        fields: { name: 'Fixture bank', type: 'bank', amount: '2000000', date: '2020-01-01' },
      });
      const bankId = String(assetOperation.input.id);
      const categoryOperation = await commitIntent({
        action: 'create',
        resource: 'categories',
        fields: { name: 'Fixture income', kind: 'income' },
      });
      const incomeCategoryId = String(categoryOperation.input.id);
      await commitIntent({
        action: 'create',
        resource: 'plans',
        fields: {
          categoryId: incomeCategoryId,
          amount: '3000000',
          month: new Date().toISOString().slice(0, 7),
        },
      });
      const incomeOperation = await commitIntent({
        action: 'create',
        resource: 'transactions',
        fields: {
          title: 'Salary',
          date: '2026-01-02',
          kind: 'income',
          categoryId: incomeCategoryId,
          amount: '500000',
          assetAccountId: bankId,
        },
      });
      await commitIntent({
        action: 'update',
        resource: 'transactions',
        reference: String(incomeOperation.input.id),
        fields: { time: '00:01' },
      });
      const editedIncome = await database.db
        .select()
        .from(TransactionModel)
        .where(eq(TransactionModel.id, String(incomeOperation.input.id)));
      assert.equal(new Date(editedIncome[0].occurredAt).toISOString(), '2026-01-01T17:01:00.000Z');
      await commitIntent({
        action: 'create',
        resource: 'transfers',
        fields: { amount: '10000', fromAssetAccountId: assetId, toAssetAccountId: bankId },
      });
      await commitIntent({
        action: 'create',
        resource: 'adjustments',
        fields: { amount: '1000', assetAccountId: bankId, note: 'Fixture valuation' },
      });
      await commitIntent({
        action: 'update',
        resource: 'profile',
        fields: { displayName: 'Updated fixture', gender: 'other', dateOfBirth: '2000-01-01' },
      });
      await commitIntent({
        action: 'archive',
        resource: 'categories',
        reference: incomeCategoryId,
        fields: {},
      });
      await commitIntent({
        action: 'restore',
        resource: 'categories',
        reference: incomeCategoryId,
        fields: {},
      });
      await commitIntent({
        action: 'remove',
        resource: 'transactions',
        reference: String(incomeOperation.input.id),
        fields: {},
      });
      const read = telegramReadService(database.db);
      assert.match((await read.balance(user)).text, /2[.,]951[.,]000/);
      assert.ok(
        (await read.report(user, { month: new Date().toISOString().slice(0, 7) })).text.length > 30,
      );
      const splitQuestion = await forms.prepare(
        link,
        user,
        {
          action: 'create',
          resource: 'transactions',
          fields: { title: 'Split fixture', kind: 'expense', categoryId, amount: '10000' },
        },
        'split-' + randomUUID(),
      );
      const splitButton = splitQuestion.buttons
        ?.flat()
        .find((button) => button.callback_data?.endsWith(':split'))?.callback_data;
      assert.ok(splitButton, splitQuestion.text);
      await forms.consume(link, user, '', splitButton, 'split-prompt-' + randomUUID());
      const splitPreview = await forms.consume(
        link,
        user,
        'Tiền mặt:5000; Fixture bank:5000',
        undefined,
        'split-preview-' + randomUUID(),
      );
      const splitConfirm = splitPreview?.buttons
        ?.flat()
        .find((button) => button.callback_data?.startsWith('confirm:'))?.callback_data;
      assert.ok(splitConfirm, splitPreview?.text);
      await service.confirm(identity, splitConfirm.slice(8));
      const queue = telegramQueueRepository(database.db);
      const botId = 'fixture-' + userId;
      const message = update(Number(actorId));
      await queue.receive(botId, [message, message]);
      assert.equal(await queue.offset(botId), 101);
      assert.equal(
        (
          await database.db
            .select()
            .from(TelegramInboxModel)
            .where(eq(TelegramInboxModel.botId, botId))
        ).length,
        1,
      );
      const engine = telegramEngine(database.db, settings, botId);
      const outputs = await database.db.transaction(async (tx) => {
        const result = await engine.handle(
          { ...message, message: { ...message.message!, text: '/menu' } },
          tx,
        );
        await queue.complete(tx, botId, 100, result);
        return result;
      });
      assert.ok(outputs.some((output) => String(output.body.text).includes('MoneyMate')));
      const ai = spawn(
        process.execPath,
        [fileURLToPath(new URL('../../MoneyMate-ai/src/server.ts', import.meta.url))],
        {
          env: {
            SystemRoot: process.env.SystemRoot,
            PATH: process.env.PATH,
            AI_HOST: '127.0.0.1',
            AI_PORT: '3019',
            AI_SERVICE_TOKEN: 'fixture-token-'.repeat(4),
          },
          stdio: 'ignore',
          windowsHide: true,
        },
      );
      try {
        let ready = false;
        for (let attempt = 0; attempt < 60; attempt++) {
          if (ai.exitCode !== null) throw new Error('AI fixture failed to start');
          ready = await fetch('http://127.0.0.1:3019/health')
            .then((response) => response.ok)
            .catch(() => false);
          if (ready) break;
          await delay(100);
        }
        assert.equal(ready, true);
        assert.equal(
          (
            await fetch('http://127.0.0.1:3019/interpret', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: '{}',
            })
          ).status,
          401,
        );
        const aiEngine = telegramEngine(
          database.db,
          { ...settings, aiUrl: 'http://127.0.0.1:3019', aiToken: 'fixture-token-'.repeat(4) },
          botId,
        );
        const response = await database.db.transaction((tx) =>
          aiEngine.handle(
            {
              ...message,
              update_id: 102,
              message: { ...message.message!, text: 'ăn trưa 25k tiền mặt' },
            },
            tx,
          ),
        );
        const send = response.find((reply) => reply.method === 'sendMessage');
        const markup = send?.body.reply_markup as
          { inline_keyboard: { callback_data?: string }[][] } | undefined;
        const confirm = markup?.inline_keyboard
          .flat()
          .find((button) => button.callback_data?.startsWith('confirm:'))?.callback_data;
        assert.ok(confirm, JSON.stringify(response));
        await database.db.transaction((tx) =>
          aiEngine.handle(
            {
              update_id: 103,
              callback_query: {
                id: 'fixture-callback',
                from: message.message!.from!,
                message: { message_id: 9, chat: message.message!.chat },
                data: confirm,
              },
            },
            tx,
          ),
        );
        const recorded = await database.db
          .select()
          .from(TransactionModel)
          .where(eq(TransactionModel.userId, userId));
        assert.ok(recorded.some((record) => record.amount === 25000n));
      } finally {
        ai.kill();
        if (ai.exitCode === null) await once(ai, 'exit');
      }
      await queue.receive(botId, [
        {
          ...message,
          update_id: 104,
          message: { ...message.message!, text: '/start ' + 'z'.repeat(43) },
        },
      ]);
      const stored = await database.db
        .select()
        .from(TelegramInboxModel)
        .where(eq(TelegramInboxModel.botId, botId));
      assert.equal(JSON.stringify(stored).includes('z'.repeat(43)), false);
      await auth.revoke(userId);
      await assert.rejects(service.confirm(identity, action.id));
      assert.equal(
        await queue.canDeliver(outputs.find((output) => output.method === 'sendMessage')!),
        false,
      );
      const expired = randomUUID();
      await database.db.insert(TelegramLinkRequestModel).values({
        id: expired,
        botId: identity.botId,
        userId,
        tokenHash: createHash('sha256').update('y'.repeat(43)).digest('hex'),
        expiresAt: new Date(Date.now() - 1),
      });
      assert.equal(await auth.claim('y'.repeat(43), identity), false);
    } finally {
      await database.db
        .delete(TelegramInboxModel)
        .where(eq(TelegramInboxModel.botId, 'fixture-' + userId));
      const { TelegramOutboxModel, TelegramBotStateModel } =
        await import('../src/models/telegram.model.ts');
      await database.db
        .delete(TelegramOutboxModel)
        .where(eq(TelegramOutboxModel.botId, 'fixture-' + userId));
      await database.db
        .delete(TelegramBotStateModel)
        .where(eq(TelegramBotStateModel.botId, 'fixture-' + userId));
      const { TransactionAllocationModel } = await import('../src/models/index.ts');
      await database.db
        .delete(TransactionAllocationModel)
        .where(eq(TransactionAllocationModel.userId, userId));
      await database.db.delete(TransactionModel).where(eq(TransactionModel.userId, userId));
      const { TransferModel, AssetAdjustmentModel, MonthlyPlanModel } =
        await import('../src/models/index.ts');
      await database.db.delete(TransferModel).where(eq(TransferModel.userId, userId));
      await database.db.delete(AssetAdjustmentModel).where(eq(AssetAdjustmentModel.userId, userId));
      await database.db.delete(MonthlyPlanModel).where(eq(MonthlyPlanModel.userId, userId));
      await database.db.delete(CategoryModel).where(eq(CategoryModel.userId, userId));
      await database.db.delete(AssetAccountModel).where(eq(AssetAccountModel.userId, userId));
      await database.db.delete(UserModel).where(eq(UserModel.id, userId));
      await database.db.delete(UserModel).where(eq(UserModel.id, otherId));
      await database.pool.end();
    }
  },
);
