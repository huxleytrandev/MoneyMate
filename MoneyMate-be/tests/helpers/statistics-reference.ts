import type {
  ReportContext,
  PeriodTotals,
  MonthlyTotals,
} from '../../src/types/statistics.types.ts';
import { balanceAt, periodKey } from '../../src/utils/finance.ts';

// Deliberately retains the pre-optimization algorithm as an independent regression oracle.
function referenceDay(iso: string, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  return ['year', 'month', 'day']
    .map((component) => parts.find((part) => part.type === component)?.value)
    .join('-');
}
function referenceDayEnd(day: string, timezone: string) {
  const anchor = Date.parse(day + 'T12:00:00Z');
  let lower = anchor - 36 * 3600000,
    upper = anchor + 36 * 3600000;
  while (upper - lower > 1) {
    const midpoint = Math.floor((lower + upper) / 2);
    if (referenceDay(new Date(midpoint).toISOString(), timezone) <= day) lower = midpoint;
    else upper = midpoint;
  }
  return lower;
}
export function referenceStatistics(context: ReportContext) {
  const { state, timezone, start, end, period, now } = context;
  const periods = new Map<string, PeriodTotals>();
  for (
    const date = new Date(start + 'T12:00:00Z');
    date.toISOString().slice(0, 10) <= end;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    const day = date.toISOString().slice(0, 10);
    const key = periodKey(day, period);
    const cutoff = Math.min(referenceDayEnd(day, timezone), now);
    const row = periods.get(key) ?? { key, income: 0n, expense: 0n, assets: 0n };
    row.assets = state.assets.reduce(
      (total, asset) => total + balanceAt(state, asset.id, cutoff),
      0n,
    );
    periods.set(key, row);
  }
  const monthly = new Map<string, MonthlyTotals>();
  for (const transaction of state.transactions) {
    const day = referenceDay(transaction.occurredAt, timezone);
    const row = periods.get(periodKey(day, period));
    if (day >= start && day <= end && row) row[transaction.kind] += transaction.amount;
    const month = day.slice(0, 7);
    const totals = monthly.get(month) ?? { month, income: 0n, expense: 0n };
    totals[transaction.kind] += transaction.amount;
    monthly.set(month, totals);
  }
  const categories = state.categories.map((category) => {
    const planned = state.plans.find(
      (plan) => plan.categoryId === category.id && plan.month.slice(0, 7) === end.slice(0, 7),
    )?.plannedAmount;
    const actual = state.transactions
      .filter(
        (transaction) =>
          transaction.categoryId === category.id &&
          referenceDay(transaction.occurredAt, timezone).slice(0, 7) === end.slice(0, 7),
      )
      .reduce((total, transaction) => total + transaction.amount, 0n);
    return {
      id: category.id,
      name: category.name,
      kind: category.kind,
      planned: planned ?? null,
      actual,
      remaining: planned === undefined ? null : planned - actual,
    };
  });
  const series = [...periods.values()];
  const previousDay = new Date(Date.parse(start + 'T12:00:00Z') - 86400000)
    .toISOString()
    .slice(0, 10);
  const opening = state.assets.reduce(
    (total, asset) => total + balanceAt(state, asset.id, referenceDayEnd(previousDay, timezone)),
    0n,
  );
  const closing = series.at(-1)?.assets ?? 0n;
  return {
    series,
    categories,
    monthly: [...monthly.values()]
      .filter((row) => row.month >= start.slice(0, 7) && row.month <= end.slice(0, 7))
      .sort((first, second) => first.month.localeCompare(second.month)),
    growthPercent: opening > 0n ? Number(((closing - opening) * 10000n) / opening) / 100 : null,
  };
}
