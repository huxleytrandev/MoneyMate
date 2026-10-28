import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { aggregateSnapshot, buildStatisticsFromAggregates } from '../utils/statistics-report.ts';
import { createStatisticsFixture } from '../../tests/fixtures/statistics.ts';
import { referenceStatistics } from '../../tests/helpers/statistics-reference.ts';

const state = createStatisticsFixture(20000);
const context = {
  state,
  timezone: 'Asia/Ho_Chi_Minh',
  start: '2025-01-01',
  end: '2025-12-31',
  period: 'month',
  now: Date.parse('2026-01-15T12:00:00Z'),
};
const beforeStart = performance.now();
const reference = referenceStatistics(context);
const beforeMs = performance.now() - beforeStart;
const afterStart = performance.now();
const optimized = buildStatisticsFromAggregates(context, aggregateSnapshot(context));
const afterMs = performance.now() - afterStart;
assert.deepEqual(optimized, reference);
console.log(
  JSON.stringify({
    benchmark: 'statistics CPU only; no database/network latency',
    transactions: state.transactions.length,
    days: 365,
    assets: state.assets.length,
    beforeMs: Math.round(beforeMs),
    afterMs: Math.round(afterMs),
    speedup: Math.round((beforeMs / afterMs) * 10) / 10,
    exactParity: true,
  }),
);
