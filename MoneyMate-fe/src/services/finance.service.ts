import type { ApiFinanceState, Statistics } from '@/types/api.types';
import { api } from './api.service';
export const fetchState = () => api<ApiFinanceState>('/state');
export const createRecord = <T>(resource: string, body: unknown) =>
  api<T>('/' + resource, { method: 'POST', body });
export const updateRecord = <T>(resource: string, id: string, body: unknown) =>
  api<T>('/' + resource + '/' + id, { method: 'PUT', body });
export const deleteRecord = (resource: string, id: string, version: number) =>
  api<void>('/' + resource + '/' + id, { method: 'DELETE', body: { version } });
export const reconcile = (id: string, version: number, value: number) =>
  api('/assets/' + id + '/reconcile', { method: 'POST', body: { version, value: String(value) } });
export const fetchStatistics = (start: string, end: string, period: string, signal?: AbortSignal) =>
  api<Statistics>('/statistics?' + new URLSearchParams({ start, end, period }), { signal });
