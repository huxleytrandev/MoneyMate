import type { ResourceName } from '../schemas/api.schema.ts';
export interface FinanceReadQuery {
  page: number;
  limit: number;
  month?: string;
  cursor?: string;
  kind?: 'income' | 'expense';
  assetId?: string;
  assetType?: 'cash' | 'bank' | 'other';
  search?: string;
}
export interface TransactionCursor {
  occurredAt: string;
  id: string;
}
export interface ReadUser {
  id: string;
  timezone: string;
}
export interface ResourceListInput {
  user: ReadUser;
  resource: ResourceName;
  query: unknown;
}
export interface ResourceFindInput {
  userId: string;
  resource: ResourceName;
  id: string;
}
export interface TransactionReadRecord {
  id: string;
  occurredAt: string;
  [field: string]: unknown;
}
export interface TransactionReadTotals {
  income: string;
  expense: string;
  total: number;
}
export interface TransactionReadResult extends Record<string, unknown> {
  data: TransactionReadRecord[];
  totals: TransactionReadTotals;
  dayTotals: Record<string, { income: string; expense: string }>;
}
