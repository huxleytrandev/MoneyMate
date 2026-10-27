import { authClient } from '@/configs/auth.config';
import { Platform } from 'react-native';
import { API_URL } from '@/configs/api.config';
import { ApiError } from '@/helpers/api-error';
export { ApiError } from '@/helpers/api-error';
let unauthorized: (() => void) | undefined;
export function onUnauthorized(callback: (() => void) | undefined) {
  unauthorized = callback;
}
export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, 20000);
  options.signal?.addEventListener('abort', abort, { once: true });
  if (options.signal?.aborted) abort();
  try {
    let response: Response;
    try {
      response = await fetch(API_URL + path, {
        method: options.method ?? 'GET',
        credentials: Platform.OS === 'web' ? 'include' : 'omit',
        headers: {
          'Content-Type': 'application/json',
          ...(Platform.OS === 'web'
            ? {}
            : { Cookie: await authClient.getCookie(), Origin: 'moneymate://' }),
        },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
        signal: controller.signal,
      });
    } catch {
      throw new ApiError(
        0,
        'Không thể kết nối máy chủ. Kiểm tra mạng và địa chỉ API trong cấu hình.',
      );
    }
    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        fields?: { message: string }[];
      };
      if (response.status === 401) unauthorized?.();
      throw new ApiError(
        response.status,
        result.fields?.[0]?.message ?? result.error ?? 'Không thể xử lý yêu cầu.',
      );
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}
