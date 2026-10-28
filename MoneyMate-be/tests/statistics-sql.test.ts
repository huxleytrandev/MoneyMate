import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createDatabase } from '../src/configs/database.ts';
import { loadEnvironment } from '../src/configs/environment.ts';
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
import { statisticsRepository } from '../src/repositories/statistics.repository.ts';
import { repositories, withUserWrite } from '../src/repositories/finance.repository.ts';
import { userRepository } from '../src/repositories/user.repository.ts';
import {
  aggregateSnapshot,
  buildStatisticsFromAggregates,
} from '../src/utils/statistics-report.ts';
import { createStatisticsFixture } from './fixtures/statistics.ts';

test(
  'SQL aggregates match exact report semantics without loading transaction history',
  {
    skip: process.env.RUN_DB_TESTS !== '1',
    timeout: 120000,
  },
  async () => {
    const database = createDatabase(
      { ...loadEnvironment(), DB_CONNECTION_TIMEOUT_MS: 30000 },
      { queryTimeoutMs: 30000 },
    );
    const userId = randomUUID();
    const fixture = createStatisticsFixture(400, userId);
    fixture.assets[1].openingAt = '2025-03-10T06:00:00Z';
    fixture.assets[2].isArchived = true;
    fixture.transactions[0].occurredAt = '2025-10-26T00:30:00Z';
    fixture.transactions[0].amount = 9999999999999999n;
    fixture.transactions[0].allocations[0].amount = 9999999999999999n;
    fixture.transactions[1].occurredAt = '2025-11-02T04:30:00Z';
    fixture.transactions[2].occurredAt = '2025-03-10T05:30:00Z';
    fixture.transactions[3].occurredAt = '2025-03-10T20:00:00Z';
    fixture.transactions[4].occurredAt = '2025-07-01T07:30:00Z';
    fixture.transactions[10].deletedAt = '2025-04-01T00:00:00Z';
    fixture.plans[0].deletedAt = '2025-04-01T00:00:00Z';
    const snapshot = {
      ...fixture,
      transactions: fixture.transactions.filter((record) => !record.deletedAt),
      plans: fixture.plans.filter((record) => !record.deletedAt),
    };
    try {
      await database.db.transaction(async (transaction) => {
        await transaction.insert(UserModel).values({
          id: userId,
          email: 'moneymate-stat-test-' + userId + '@example.invalid',
          displayName: 'Disposable statistics test',
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
      for (const window of [
        { timezone: 'CST', start: '2025-03-08', end: '2025-03-10', period: 'week' },
        { timezone: 'IST', start: '2025-03-10', end: '2025-03-10', period: 'month' },
        { timezone: 'PST', start: '2025-07-01', end: '2025-07-01', period: 'month' },
        { timezone: '+07:00', start: '2025-03-05', end: '2025-03-15', period: 'week' },
        { timezone: '-03:30', start: '2025-03-01', end: '2025-03-31', period: 'month' },
        { timezone: '+23:59', start: '2025-03-01', end: '2025-03-31', period: 'quarter' },
        { timezone: '+07', start: '2025-03-05', end: '2025-03-15', period: 'week' },
        { timezone: '-0330', start: '2025-03-01', end: '2025-03-31', period: 'month' },
        { timezone: 'Asia/Ho_Chi_Minh', start: '2025-03-05', end: '2025-03-15', period: 'month' },
        { timezone: 'America/New_York', start: '2025-03-08', end: '2025-03-10', period: 'week' },
        { timezone: 'Pacific/Apia', start: '2025-01-01', end: '2025-12-31', period: 'quarter' },
        { timezone: 'Asia/Ho_Chi_Minh', start: '2025-04-01', end: '2025-03-15', period: 'month' },
        { timezone: 'Atlantic/Azores', start: '2025-10-26', end: '2025-10-26', period: 'week' },
        { timezone: 'America/Havana', start: '2025-11-02', end: '2025-11-02', period: 'month' },
      ]) {
        const context = { ...window, now: Date.parse('2026-01-15T12:00:00Z') };
        const rows = await statisticsRepository(database.db).aggregate({ userId, ...context });
        const expectedAggregates = aggregateSnapshot({ state: snapshot, ...context });
        assert.equal(rows.opening, expectedAggregates.opening);
        const actual = buildStatisticsFromAggregates(context, rows);
        const expected = buildStatisticsFromAggregates(
          context,
          aggregateSnapshot({ state: snapshot, ...context }),
        );
        assert.deepEqual(actual, expected);
        assert.ok(rows.wealth.length <= 365);
      }
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
