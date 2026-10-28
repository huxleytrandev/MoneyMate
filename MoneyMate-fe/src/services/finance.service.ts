import type {
  ApiAdjustment,
  ApiFinanceState,
  ApiPage,
  ApiTransactionPage,
  Statistics,
} from '@/types/api.types';
import type { TransactionQuery } from '@/types/transaction-page.types';
import { api } from './api.service';

export const fetchState = (month: string, signal?: AbortSignal) =>
  api<ApiFinanceState>('/state?' + new URLSearchParams({ month, limit: '50' }), { signal });
export function fetchTransactions(input: TransactionQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({ month: input.month, limit: String(input.limit ?? 50) });
  for (const key of ['cursor', 'kind', 'assetType', 'search'] as const)
    if (input[key]) params.set(key, input[key]);
  return api<ApiTransactionPage>('/transactions?' + params, { signal });
}
export const createRecord = <Result>(resource: string, body: unknown) =>
  api<Result>('/' + resource, { method: 'POST', body });
export const updateRecord = <Result>(resource: string, id: string, body: unknown) =>
  api<Result>('/' + resource + '/' + id, { method: 'PUT', body });
export const deleteRecord = (resource: string, id: string, version: number) =>
  api<void>('/' + resource + '/' + id, { method: 'DELETE', body: { version } });
export const reconcile = (id: string, version: number, value: number) =>
  api('/assets/' + id + '/reconcile', { method: 'POST', body: { version, value: String(value) } });
export const fetchStatistics = (start: string, end: string, period: string, signal?: AbortSignal) =>
  api<Statistics>('/statistics?' + new URLSearchParams({ start, end, period }), { signal });

export function fetchAssetAdjustments(
  input: { assetId: string; page: number },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    assetId: input.assetId,
    page: String(input.page),
    limit: '30',
  });
  return api<ApiPage<ApiAdjustment>>('/adjustments?' + params, { signal });
}
