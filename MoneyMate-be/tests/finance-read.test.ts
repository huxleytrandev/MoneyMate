import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createDatabase } from '../src/configs/database.ts';
import { loadEnvironment } from '../src/configs/environment.ts';
import { financeReadService } from '../src/services/finance-read.service.ts';
import { financeReadQuerySchema } from '../src/schemas/finance-read.schema.ts';
import { monthWindow } from '../src/utils/month-window.ts';
import { transactionPage, decodeTransactionCursor } from '../src/utils/pagination.ts';
import { localDay, balanceAt } from '../src/utils/finance.ts';
import { AppError } from '../src/utils/app-error.ts';
import { createStatisticsFixture } from './fixtures/statistics.ts';
import {
  UserModel,
  AssetAccountModel,
  CategoryModel,
  MonthlyPlanModel,
  TransactionModel,
  TransactionAllocationModel,
  TransferModel,
  AssetAdjustmentModel,
} from '../src/models/index.ts';
import { repositories, withUserWrite } from '../src/repositories/finance.repository.ts';
import { userRepository } from '../src/repositories/user.repository.ts';

test('read query validates bounds and cursor preserves database microseconds', () => {
  for (const month of ['2025-13', '0001-01', '9999-12'])
    assert.equal(financeReadQuerySchema.safeParse({ month }).success, false);
  assert.equal(financeReadQuerySchema.safeParse({ limit: 1000 }).success, false);
  const record = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    occurredAt: '2025-03-10T05:30:00.123456+00:00',
  };
  const page = transactionPage(
    { data: [record, record], totals: { income: '0', expense: '0', total: 2 }, dayTotals: {} },
    { page: 1, limit: 1 },
  );
  assert.equal(page.data.length, 1);
  assert.equal(page.page.hasMore, true);
  assert.deepEqual(decodeTransactionCursor(page.page.nextCursor!), record);
  assert.throws(
    () => decodeTransactionCursor('invalid'),
    (failure) => failure instanceof AppError && failure.status === 422,
  );
});
test('month bounds include the first repeated midnight and leap days', () => {
  assert.deepEqual(monthWindow('2015-11', 'America/Havana'), {
    start: '2015-11-01T04:00:00.000Z',
    end: '2015-12-01T05:00:00.000Z',
  });
  assert.deepEqual(monthWindow('2024-02', 'Asia/Ho_Chi_Minh'), {
    start: '2024-01-31T17:00:00.000Z',
    end: '2024-02-29T17:00:00.000Z',
  });
});
test(
  'SQL pages keep exact aggregates, ownership, source/search filters and bounded asset history',
  {
    skip: process.env.RUN_DB_TESTS !== '1',
    timeout: 120000,
  },
  async () => {
    const database = createDatabase(
      { ...loadEnvironment(), DB_CONNECTION_TIMEOUT_MS: 30000 },
      { queryTimeoutMs: 30000 },
    );
    const userId = randomUUID(),
      fixture = createStatisticsFixture(12, userId);
    fixture.transactions = fixture.transactions.map((record) => ({
      ...record,
      occurredAt: '2025-03-10T05:30:00.123456Z',
    }));
    fixture.transactions[0].title = 'Đi chợ 100%_';
    fixture.transactions[0].amount = 9999999999999999n;
    fixture.transactions[0].allocations[0].amount = fixture.transactions[0].amount;
    fixture.transactions[2].title = '100ab';
    fixture.transactions[10].deletedAt = '2025-04-01T00:00:00Z';
    fixture.transactions[11].occurredAt = '2015-11-01T04:30:00.123456Z';
    const user = { id: userId, timezone: 'Asia/Ho_Chi_Minh' };
    const snapshot = {
      ...fixture,
      transactions: fixture.transactions.filter((record) => !record.deletedAt),
    };
    try {
      await database.db.transaction(async (transaction) => {
        await transaction.insert(UserModel).values({
          id: userId,
          email: 'moneymate-read-test-' + userId + '@example.invalid',
          displayName: 'Read fixture',
        });
        await transaction.insert(AssetAccountModel).values(fixture.assets);
        await transaction.insert(CategoryModel).values(fixture.categories);
        await transaction.insert(MonthlyPlanModel).values(fixture.plans);
        await transaction.insert(TransactionModel).values(
          fixture.transactions.map(({ allocations: _allocations, ...record }) => {
            void _allocations;
            return record;
          }),
        );
        await transaction
          .insert(TransactionAllocationModel)
          .values(fixture.transactions.flatMap((record) => record.allocations));
        await transaction.insert(TransferModel).values(fixture.transfers);
        await transaction.insert(AssetAdjustmentModel).values(fixture.adjustments);
      });
      const read = financeReadService(database.db);
      const query = { month: '2025-03', limit: 3 };
      const first = await read.list({ user, resource: 'transactions', query });
      assert.ok('page' in first);
      assert.equal(first.data.length, 3);
      assert.equal(first.totals.total, 10);
      assert.equal(first.page.hasMore, true);
      assert.ok(first.data.every((record) => record.occurredAt.includes('.123456')));
      const ids = new Set<string>();
      let page = first;
      for (;;) {
        for (const record of page.data) {
          assert.equal(ids.has(record.id), false);
          ids.add(record.id);
        }
        if (!page.page.nextCursor) break;
        const next = await read.list({
          user,
          resource: 'transactions',
          query: { ...query, cursor: page.page.nextCursor },
        });
        assert.ok('page' in next);
        page = next;
      }
      assert.equal(ids.size, 10);
      const categoryId = snapshot.transactions[0].categoryId;
      const categoryRows = snapshot.transactions.filter(
        (record) => record.categoryId === categoryId && record.occurredAt.startsWith('2025-03'),
      );
      const categoryPage = await read.list({
        user,
        resource: 'transactions',
        query: { ...query, categoryId, limit: 1 },
      });
      assert.ok('totals' in categoryPage);
      assert.equal(categoryPage.totals.total, categoryRows.length);
      assert.ok(categoryPage.data.every((record) => record.categoryId === categoryId));
      assert.equal(
        BigInt(categoryPage.totals.income) + BigInt(categoryPage.totals.expense),
        categoryRows.reduce((sum, record) => sum + record.amount, 0n),
      );
      const foreignCategory = await read.list({
        user,
        resource: 'transactions',
        query: { ...query, categoryId: randomUUID() },
      });
      assert.ok('totals' in foreignCategory);
      assert.equal(foreignCategory.totals.total, 0);
      const window = await read.state({ user, query });
      assert.ok('summary' in window);
      assert.equal(window.transactions.length, 3);
      assert.equal(window.summary.transactionCount, 10);
      const expectedIncome = snapshot.transactions
        .filter((record) => record.kind === 'income' && record.occurredAt.startsWith('2025-03'))
        .reduce((sum, record) => sum + record.amount, 0n);
      assert.equal(window.summary.income, expectedIncome.toString());
      const assets = window.assets as { id: string; currentBalance: string }[];
      for (const asset of assets)
        assert.equal(asset.currentBalance, balanceAt(snapshot, asset.id).toString());
      const search = await read.list({
        user,
        resource: 'transactions',
        query: { ...query, search: 'di cho' },
      });
      assert.ok('totals' in search);
      assert.equal(search.totals.total, 1);
      assert.equal(search.data[0].amount, fixture.transactions[0].amount.toString());
      const escaped = await read.list({
        user,
        resource: 'transactions',
        query: { ...query, search: '100%_' },
      });
      assert.ok('totals' in escaped);
      assert.equal(escaped.totals.total, 1);
      for (const timezone of ['+07:00', '+23:59', 'CST']) {
        const localized = await read.list({
          user: { ...user, timezone },
          resource: 'transactions',
          query: { ...query, search: 'di cho' },
        });
        assert.ok('dayTotals' in localized);
        assert.ok(localDay(fixture.transactions[0].occurredAt, timezone) in localized.dayTotals);
      }
      const fold = await read.list({
        user: { ...user, timezone: 'America/Havana' },
        resource: 'transactions',
        query: { month: '2015-11' },
      });
      assert.ok('totals' in fold);
      assert.equal(fold.totals.total, 1);
      const income = await read.list({
        user,
        resource: 'transactions',
        query: { ...query, kind: 'income' },
      });
      assert.ok('totals' in income);
      assert.equal(income.totals.expense, '0');
      const bank = await read.list({
        user,
        resource: 'transactions',
        query: { ...query, assetType: 'bank' },
      });
      assert.ok('totals' in bank);
      assert.equal(
        bank.totals.total,
        snapshot.transactions.filter(
          (record) =>
            record.occurredAt.startsWith('2025-03') &&
            record.allocations[0].assetAccountId === fixture.assets[1].id,
        ).length,
      );
      const other = await read.list({
        user: { ...user, id: randomUUID() },
        resource: 'transactions',
        query,
      });
      assert.ok('totals' in other);
      assert.equal(other.totals.total, 0);
      await assert.rejects(
        read.find({
          userId: randomUUID(),
          resource: 'transactions',
          id: fixture.transactions[0].id,
        }),
        (failure) => failure instanceof AppError && failure.status === 404,
      );
      const history = await read.list({
        user,
        resource: 'adjustments',
        query: { assetId: fixture.assets[0].id },
      });
      assert.equal(history.pagination.total, 0);
      const actualHistory = await read.list({
        user,
        resource: 'adjustments',
        query: { assetId: fixture.assets[2].id },
      });
      assert.equal(actualHistory.pagination.total, 1);
    } finally {
      await withUserWrite(database.db, userId, async (transaction) => {
        const finance = repositories(transaction);
        await finance.allocations.removeAll(userId);
        await finance.transactions.removeAll(userId);
        await finance.plans.removeAll(userId);
        await finance.transfers.removeAll(userId);
        await finance.adjustments.removeAll(userId);
        await finance.categories.removeAll(userId);
        await finance.assets.removeAll(userId);
        await userRepository(transaction).remove(userId);
      });
      await database.pool.end();
    }
  },
);
