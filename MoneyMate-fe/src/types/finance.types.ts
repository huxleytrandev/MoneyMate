export type TransactionKind = 'income' | 'expense';
export type AssetKind = 'cash' | 'bank' | 'other';
export interface Asset {
  id: string;
  name: string;
  type: AssetKind;
  openingValue: number;
  openingAt?: string;
  version?: number;
  isArchived?: boolean;
}
export interface Category {
  id: string;
  name: string;
  kind: TransactionKind;
  version?: number;
  isArchived?: boolean;
}
export interface Allocation {
  assetId: string;
  amount: number;
}
export interface Transaction {
  version?: number;
  id: string;
  title: string;
  categoryId: string;
  kind: TransactionKind;
  amount: number;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  allocations: Allocation[];
}
export interface MonthlyPlan {
  id?: string;
  version?: number;
  categoryId: string;
  month: string;
  amount: number;
}
export interface Adjustment {
  version?: number;
  id: string;
  assetId: string;
  delta: number;
  occurredAt: string;
}
export interface Transfer {
  id: string;
  version?: number;
  fromAssetId: string;
  toAssetId: string;
  amount: number;
  occurredAt: string;
  note?: string;
}
export interface FinanceState {
  transfers?: Transfer[];
  assets: Asset[];
  categories: Category[];
  transactions: Transaction[];
  plans: MonthlyPlan[];
  adjustments: Adjustment[];
}
export interface TransactionDraft {
  title: string;
  categoryId: string;
  kind: TransactionKind;
  amount: string;
  date: string;
  time: string;
  allocations: { assetId: string; amount: string }[];
}
