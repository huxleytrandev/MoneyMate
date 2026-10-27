export type TransactionKind = 'income' | 'expense';
export type AssetKind = 'cash' | 'bank' | 'other';
export interface Asset {
  id: string;
  name: string;
  type: AssetKind;
  openingValue: number;
}
export interface Category {
  id: string;
  name: string;
  kind: TransactionKind;
}
export interface Allocation {
  assetId: string;
  amount: number;
}
export interface Transaction {
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
  categoryId: string;
  month: string;
  amount: number;
}
export interface Adjustment {
  id: string;
  assetId: string;
  delta: number;
  occurredAt: string;
}
export interface FinanceState {
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
