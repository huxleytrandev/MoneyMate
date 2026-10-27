import { useAuth } from '@/hooks/useAuth';
import { loginSchema, registerSchema } from '@/schemas/auth.schema';
import * as authService from '@/services/auth.service';
import { useState } from 'react';
export function useAuthForm(mode: 'login' | 'register') {
  const { establish } = useAuth();
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
    setValues((valueValue) => ({ ...valueValue, [key]: value }));
    setErrors((failure) => ({ ...failure, [key]: '' }));
    setMessage('');
  };
  async function submit() {
    const result = (mode === 'login' ? loginSchema : registerSchema).safeParse(values);
    if (!result.success) {
      const next: Record<string, string> = {};
      result.error.issues.forEach((failure) => {
        const key = String(failure.path[0]);
        next[key] ??= failure.message;
      });
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    setMessage('');
    try {
      const response =
        mode === 'login'
          ? await authService.login(result.data)
          : await authService.register({ ...values, ...result.data });
      await establish(response);
    } catch (failure) {
      setMessage(
        failure instanceof Error ? failure.message : 'Không thể kết nối. Vui lòng thử lại.',
      );
    } finally {
      setBusy(false);
      setValues((value) => ({ ...value, password: '', confirmPassword: '' }));
    }
  }
  return { values, errors, message, busy, setField, submit };
}
