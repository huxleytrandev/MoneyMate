export interface ApiRecord {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface ApiAsset extends ApiRecord {
  name: string;
  type: 'cash' | 'bank' | 'other';
  openingValue: string;
  openingAt: string;
  isArchived: boolean;
}
export interface ApiCategory extends ApiRecord {
  name: string;
  kind: 'income' | 'expense';
  isArchived: boolean;
}
export interface ApiPlan extends ApiRecord {
  categoryId: string;
  kind: 'income' | 'expense';
  month: string;
  plannedAmount: string;
}
export interface ApiTransaction extends ApiRecord {
  title: string;
  kind: 'income' | 'expense';
  categoryId: string;
  amount: string;
  occurredAt: string;
  allocations: { assetAccountId: string; amount: string }[];
}
export interface ApiTransfer extends ApiRecord {
  fromAssetAccountId: string;
  toAssetAccountId: string;
  amount: string;
  occurredAt: string;
  note: string | null;
}
export interface ApiAdjustment extends ApiRecord {
  assetAccountId: string;
  deltaAmount: string;
  reason: 'valuation' | 'reconciliation';
  note: string;
  occurredAt: string;
}
export interface ApiFinanceState {
  assets: ApiAsset[];
  categories: ApiCategory[];
  plans: ApiPlan[];
  transactions: ApiTransaction[];
  transfers: ApiTransfer[];
  adjustments: ApiAdjustment[];
}
export interface Statistics {
  currency: string;
  timezone: string;
  growthPercent: number | null;
  series: { key: string; income: string; expense: string; assets: string }[];
}
