import type { FinanceSnapshot } from './finance-snapshot.types.ts';

export interface ReportWindow {
  timezone: string;
  start: string;
  end: string;
  period: string;
  now: number;
}
export interface ReportContext extends ReportWindow {
  state: FinanceSnapshot;
}
export interface PeriodTotals {
  key: string;
  income: bigint;
  expense: bigint;
  assets: bigint;
}
export interface MonthlyTotals {
  month: string;
  income: bigint;
  expense: bigint;
}
export interface CategoryTotals {
  id: string;
  name: string;
  kind: string;
  planned: bigint | null;
  actual: bigint;
  remaining: bigint | null;
}
export interface DailyActual {
  day: string;
  income: bigint;
  expense: bigint;
}
export interface StatisticsAggregates {
  opening: bigint;
  wealth: { day: string; delta: bigint }[];
  actuals: DailyActual[];
  monthly: MonthlyTotals[];
  categories: CategoryTotals[];
}
export interface RawStatisticsAggregates {
  opening: string;
  wealth: { day: string; delta: string }[];
  actuals: { day: string; income: string; expense: string }[];
  monthly: { month: string; income: string; expense: string }[];
  categories: { id: string; name: string; kind: string; planned: string | null; actual: string }[];
}
