import { AppError } from '../utils/app-error.ts';
import type { TelegramSettings } from '../types/telegram.types.ts';
export class TelegramApiError extends Error {
  readonly status: number;
  readonly retryAfter: number;
  constructor(status: number, retryAfter = 2) {
    super('Telegram API unavailable (' + status + ').');
    this.status = status;
    this.retryAfter = retryAfter;
  }
}
export function telegramApi(settings: TelegramSettings) {
  async function call<Result>(
    method: string,
    body: Record<string, unknown> = {},
    signal?: AbortSignal,
  ): Promise<Result> {
    if (!settings.token) throw new TelegramApiError(503);
    let response: Response;
    try {
      response = await fetch('https://api.telegram.org/bot' + settings.token + '/' + method, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.any([AbortSignal.timeout(35000), ...(signal ? [signal] : [])]),
      });
    } catch {
      throw new TelegramApiError(503);
    }
    const result = (await response.json().catch(() => null)) as {
      ok: boolean;
      result: Result;
      error_code?: number;
      parameters?: { retry_after?: number };
    } | null;
    if (!result?.ok)
      throw new TelegramApiError(
        result?.error_code ?? response.status,
        result?.parameters?.retry_after ?? 2,
      );
    return result.result;
  }
  let identity: Promise<{ id: number; username: string }> | undefined;
  const getMe = () => {
    identity ??= call<{ id: number; username: string }>('getMe').catch((error: unknown) => {
      identity = undefined;
      throw error;
    });
    return identity;
  };
  async function photo(fileId: string) {
    const file = await call<{ file_path?: string; file_size?: number }>('getFile', {
      file_id: fileId,
    });
    if (
      !file.file_path ||
      !/^[A-Za-z0-9_/-]+\.jpe?g$/i.test(file.file_path) ||
      (file.file_size ?? 0) > 131072
    )
      throw new AppError(422, 'Chọn ảnh JPEG nhỏ hơn 128 KB.');
    let response: Response;
    try {
      response = await fetch(
        'https://api.telegram.org/file/bot' + settings.token + '/' + file.file_path,
        { signal: AbortSignal.timeout(10000) },
      );
    } catch {
      throw new TelegramApiError(503);
    }
    if (!response.ok || !response.body) throw new TelegramApiError(response.status);
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const next = await reader.read();
        if (next.done) break;
        size += next.value.length;
        if (size > 131072) {
          await reader.cancel();
          throw new AppError(422, 'Ảnh quá lớn, chọn ảnh nhỏ hơn 128 KB.');
        }
        chunks.push(next.value);
      }
    } finally {
      reader.releaseLock();
    }
    return 'data:image/jpeg;base64,' + Buffer.concat(chunks).toString('base64');
  }
  return { call, getMe, photo };
}
