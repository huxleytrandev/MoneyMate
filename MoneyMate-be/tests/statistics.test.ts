import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  aggregateSnapshot,
  buildStatisticsFromAggregates,
} from '../src/utils/statistics-report.ts';
import { dayEnd } from '../src/utils/statistics.ts';
import { localDay } from '../src/utils/finance.ts';
import { createStatisticsFixture } from './fixtures/statistics.ts';
import { referenceStatistics } from './helpers/statistics-reference.ts';

for (const timezone of [
  'Asia/Ho_Chi_Minh',
  'America/New_York',
  'Pacific/Apia',
  '+07:00',
  '-03:30',
  '+23:59',
]) {
  for (const period of ['week', 'month', 'quarter', 'year']) {
    test('statistics sweep preserves report semantics: ' + timezone + ' / ' + period, () => {
      const state = createStatisticsFixture(400);
      const context = {
        state,
        timezone,
        start: '2025-03-05',
        end: '2025-03-15',
        period,
        now: Date.parse('2026-01-15T12:00:00Z'),
      };
      assert.deepEqual(
        buildStatisticsFromAggregates(context, aggregateSnapshot(context)),
        referenceStatistics(context),
      );
    });
  }
}
test('wealth sweep honors opening dates and excludes movements later than now without losing actual totals', () => {
  const state = createStatisticsFixture(80);
  state.assets[1].openingAt = '2025-03-10T06:00:00Z';
  const transaction = state.transactions[0];
  transaction.occurredAt = '2025-03-10T12:00:00Z';
  const context = {
    state,
    timezone: 'America/New_York',
    start: '2025-03-09',
    end: '2025-03-10',
    period: 'week',
    now: Date.parse('2025-03-10T11:59:30Z'),
  };
  assert.deepEqual(
    buildStatisticsFromAggregates(context, aggregateSnapshot(context)),
    referenceStatistics(context),
  );
});
test('a future start preserves empty series, full ending-month category totals and legacy growth semantics', () => {
  const state = createStatisticsFixture(90);
  const context = {
    state,
    timezone: 'Asia/Ho_Chi_Minh',
    start: '2025-04-01',
    end: '2025-03-15',
    period: 'month',
    now: Date.parse('2025-03-15T12:00:00Z'),
  };
  assert.deepEqual(
    buildStatisticsFromAggregates(context, aggregateSnapshot(context)),
    referenceStatistics(context),
  );
});
test('timezone boundaries cover both DST transitions and skipped calendar days', () => {
  assert.equal(
    new Date(dayEnd('2025-03-09', 'America/New_York') + 1).toISOString(),
    '2025-03-10T04:00:00.000Z',
  );
  assert.equal(
    new Date(dayEnd('2025-11-02', 'America/New_York') + 1).toISOString(),
    '2025-11-03T05:00:00.000Z',
  );
  assert.equal(localDay('2025-03-10T03:59:59.999Z', 'America/New_York'), '2025-03-09');
  assert.equal(localDay('2011-12-30T10:00:00Z', 'Pacific/Apia'), '2011-12-31');
});
