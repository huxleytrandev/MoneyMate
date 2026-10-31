import { useCallback, useEffect, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import {
  telegramStatus,
  requestTelegramLink,
  confirmTelegramLink,
  revokeTelegramLink,
} from '@/services/telegram.service';
import type { TelegramStatus } from '@/types/telegram.types';
export function useTelegramLink() {
  const [status, setStatus] = useState<TelegramStatus | null>(null),
    [url, setUrl] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const mounted = useRef(true),
    writing = useRef(false);
  const refresh = useCallback(async () => {
    try {
      const value = await telegramStatus();
      if (mounted.current) {
        setStatus(value);
        setError('');
      }
    } catch (failure) {
      if (mounted.current)
        setError(failure instanceof Error ? failure.message : 'Không tải được kết nối Telegram.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);
  useEffect(() => {
    if (!status?.request) return;
    const timer = setInterval(() => void refresh(), 3000);
    return () => clearInterval(timer);
  }, [status?.request?.id, refresh]);
  async function execute(operation: () => Promise<unknown>) {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError('');
    try {
      await operation();
      await refresh();
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : 'Không thể thay đổi kết nối.';
      if (mounted.current) setError(message);
      throw failure;
    } finally {
      writing.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function request() {
    await execute(async () => {
      const result = await requestTelegramLink();
      if (mounted.current) setUrl(result.url);
    });
  }
  async function confirm() {
    const candidate = status?.request?.candidate;
    if (!status?.request || !candidate) throw new Error('Chưa có danh tính Telegram để xác nhận.');
    await execute(() => confirmTelegramLink(status.request!.id, candidate.telegramUserId));
    setUrl('');
  }
  async function revoke() {
    await execute(revokeTelegramLink);
    setUrl('');
  }
  async function open() {
    try {
      if (url) await Linking.openURL(url);
    } catch {
      setError('Không mở được Telegram. Kiểm tra ứng dụng Telegram trên thiết bị.');
    }
  }
  return { status, url, busy, loading, error, refresh, request, confirm, revoke, open };
}
