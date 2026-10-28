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
  currentBalance?: string;
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
  summary?: {
    month: string;
    income: string;
    expense: string;
    actualByCategory: Record<string, string>;
    transactionCount: number;
  };
  page?: { nextCursor: string | null; hasMore: boolean };
}
export interface Statistics {
  currency: string;
  timezone: string;
  growthPercent: number | null;
  series: { key: string; income: string; expense: string; assets: string }[];
}

export interface ApiTransactionPage {
  data: ApiTransaction[];
  page: { nextCursor: string | null; hasMore: boolean };
  totals: { income: string; expense: string; total: number };
  dayTotals?: Record<string, { income: string; expense: string }>;
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
}
export interface ApiPage<Record> {
  data: Record[];
  pagination: ApiPagination;
}
