import type { CursorPage, Transaction, TransactionKind, AssetKind } from './finance.types';
export interface TransactionQuery {
  month: string;
  categoryId?: string;
  limit?: number;
  cursor?: string;
  kind?: TransactionKind;
  assetType?: AssetKind;
  search?: string;
}
export interface TransactionTotals {
  income: number;
  expense: number;
  total: number;
}
export interface TransactionPage {
  data: Transaction[];
  page: CursorPage;
  totals: TransactionTotals;
  dayTotals?: Record<string, { income: number; expense: number }>;
}
export interface TransactionDaySection {
  key: string;
  data: Transaction[];
  income: number;
  expense: number;
  partial: boolean;
}
