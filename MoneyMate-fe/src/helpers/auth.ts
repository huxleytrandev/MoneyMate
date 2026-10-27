import { ApiError } from './api-error.ts';
import type { UserSession } from '../types/auth.types';
interface BetterAuthError {
  message?: string;
  status?: number;
}
export function requireAuthData<Data>(result: {
  data: Data | null;
  error: BetterAuthError | null;
}): Data {
  if (result.error || !result.data)
    throw new ApiError(result.error?.status ?? 400, result.error?.message ?? 'Không thể xác thực.');
  return result.data;
}
export function mapAuthUser(user: {
  id: string;
  email: string;
  name: string;
  timezone?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}): UserSession {
  return {
    id: user.id,
    email: user.email,
    displayName: user.name,
    timezone: user.timezone ?? 'Asia/Ho_Chi_Minh',
    createdAt: new Date(user.createdAt).toISOString(),
    updatedAt: new Date(user.updatedAt).toISOString(),
  };
}
