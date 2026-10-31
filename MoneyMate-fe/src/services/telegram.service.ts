import { api } from './api.service';
import type { TelegramStatus } from '@/types/telegram.types';
export const telegramStatus = (signal?: AbortSignal) =>
  api<TelegramStatus>('/telegram/status', { signal });
export const requestTelegramLink = () =>
  api<{ url: string; expiresAt: string }>('/telegram/link-requests', { method: 'POST', body: {} });
export const confirmTelegramLink = (requestId: string, telegramUserId: string) =>
  api('/telegram/confirm', { method: 'POST', body: { requestId, telegramUserId } });
export const revokeTelegramLink = () => api<void>('/telegram/link', { method: 'DELETE', body: {} });
