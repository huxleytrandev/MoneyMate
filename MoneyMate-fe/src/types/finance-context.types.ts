import type { Asset, Category, FinanceState, Transaction, Transfer } from './finance.types';
export type FinanceResource =
  'assets' | 'categories' | 'plans' | 'transactions' | 'transfers' | 'adjustments';
export interface PlanInput {
  categoryId: string;
  month: string;
  amount: number;
  expectedVersion?: number | null;
}
export interface FinanceActions {
  saveTransaction: (transaction: Transaction) => Promise<void>;
  savePlan: (
    categoryId: string,
    month: string,
    amount: number,
    expectedVersion?: number | null,
  ) => Promise<void>;
  addCategory: (category: Category) => Promise<Category>;
  addAsset: (asset: Asset) => Promise<void>;
  adjustAsset: (assetId: string, value: number, expectedVersion?: number) => Promise<void>;
  removeRecord: (resource: FinanceResource, id: string, expectedVersion?: number) => Promise<void>;
  updateAsset: (asset: Asset) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  saveTransfer: (transfer: Transfer) => Promise<void>;
}
export interface FinanceContextValue extends FinanceActions {
  state: FinanceState;
  refresh: () => Promise<void>;
  busy: boolean;
}
export interface FinanceActionDependencies {
  getState: () => FinanceState;
  execute: <Result>(operation: () => Promise<Result>) => Promise<Result>;
}
