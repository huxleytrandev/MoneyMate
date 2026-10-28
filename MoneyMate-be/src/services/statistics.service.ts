import { statisticsQuerySchema } from '../schemas/api.schema.ts';
import { localDay } from '../utils/finance.ts';
import { aggregateSnapshot, buildStatisticsFromAggregates } from '../utils/statistics-report.ts';
import { statisticsRepository } from '../repositories/statistics.repository.ts';
import type { FinanceSnapshot } from '../types/finance-snapshot.types.ts';
import type { Database } from '../types/database.types.ts';
import type { StatisticsAggregates } from '../types/statistics.types.ts';

function reportWindow(timezone: string, input: unknown) {
  const query = statisticsQuerySchema.parse(input);
  const now = Date.now();
  const today = localDay(new Date(now).toISOString(), timezone);
  return { query, window: { timezone, ...query, end: query.end > today ? today : query.end, now } };
}
function reportResult(context: ReturnType<typeof reportWindow>, aggregates: StatisticsAggregates) {
  return {
    currency: 'VND',
    timezone: context.window.timezone,
    ...context.query,
    asOf: new Date(context.window.now).toISOString(),
    ...buildStatisticsFromAggregates(context.window, aggregates),
  };
}
export function buildStatistics(state: FinanceSnapshot, timezone: string, input: unknown) {
  const context = reportWindow(timezone, input);
  return reportResult(context, aggregateSnapshot({ ...context.window, state }));
}
export function statisticsService(database: Database) {
  async function report(userId: string, timezone: string, input: unknown) {
    const context = reportWindow(timezone, input);
    const aggregates = await statisticsRepository(database).aggregate({
      userId,
      ...context.window,
    });
    return reportResult(context, aggregates);
  }
  return { report };
}
