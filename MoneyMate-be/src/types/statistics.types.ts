import type { FinanceSnapshot } from './finance-snapshot.types.ts';
export interface ReportContext {
  state: FinanceSnapshot;
  timezone: string;
  start: string;
  end: string;
  period: string;
  now: number;
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
