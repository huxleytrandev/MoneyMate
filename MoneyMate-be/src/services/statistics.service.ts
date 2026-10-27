import { financeService } from './finance.service.ts';
import { statisticsQuerySchema } from '../schemas/api.schema.ts';
import { localDay } from '../utils/finance.ts';
import {
  buildPeriodSeries,
  buildMonthlyTotals,
  buildCategoryTotals,
  assetGrowth,
} from '../utils/statistics-report.ts';
import type { FinanceSnapshot } from '../types/finance-snapshot.types.ts';
import type { Database } from '../types/database.types.ts';

export function buildStatistics(state: FinanceSnapshot, timezone: string, input: unknown) {
  const query = statisticsQuerySchema.parse(input);
  const now = Date.now();
  const today = localDay(new Date(now).toISOString(), timezone);
  const context = { state, timezone, ...query, end: query.end > today ? today : query.end, now };
  const series = buildPeriodSeries(context);
  return {
    currency: 'VND',
    timezone,
    ...query,
    asOf: new Date(now).toISOString(),
    series,
    categories: buildCategoryTotals(context),
    monthly: buildMonthlyTotals(context),
    growthPercent: assetGrowth(context, series),
  };
}
export function statisticsService(database: Database) {
  const finance = financeService(database);
  return {
    report: async (userId: string, timezone: string, query: unknown) =>
      buildStatistics(await finance.snapshot(userId), timezone, query),
  };
}
