import { useState } from 'react';
import { loginSchema, registerSchema } from '@/schemas/auth.schema';
import * as authService from '@/services/auth.service';
export function useAuthForm(mode: 'login' | 'register') {
  const [values, setValues] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const setField = (key: keyof typeof values, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
    setMessage('');
  };
  async function submit() {
    const result = (mode === 'login' ? loginSchema : registerSchema).safeParse(values);
    if (!result.success) {
      const next: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        const key = String(i.path[0]);
        next[key] ??= i.message;
      });
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'login') await authService.login(result.data);
      else await authService.register({ ...values, ...result.data });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Không thể kết nối. Vui lòng thử lại.');
    } finally {
      setBusy(false);
      setValues((v) => ({ ...v, password: '', confirmPassword: '' }));
    }
  }
  return { values, errors, message, busy, setField, submit };
}
