import type { TransactionQuery } from '../types/transaction-page.types';
export function transactionQueryParams(input: TransactionQuery) {
  const params = new URLSearchParams({ month: input.month, limit: String(input.limit ?? 50) });
  for (const key of ['cursor', 'kind', 'assetType', 'search', 'categoryId'] as const)
    if (input[key]) params.set(key, input[key]);
  return params;
}
