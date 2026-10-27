import { authClient } from '@/configs/auth.config';
import { requireAuthData, mapAuthUser } from '@/helpers/auth';
import { ApiError } from '@/helpers/api-error';
import type { AuthResult, LoginInput, RegisterInput, ProfileInput } from '@/types/auth.types';
import { api } from './api.service';
export async function login(input: LoginInput): Promise<AuthResult> {
  const data = requireAuthData(
    await authClient.signIn.email({ email: input.email, password: input.password }),
  );
  return { user: mapAuthUser(data.user) };
}
export async function register(input: RegisterInput): Promise<AuthResult> {
  const data = requireAuthData(
    await authClient.signUp.email({
      name: input.displayName,
      email: input.email,
      password: input.password,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  );
  return { user: mapAuthUser(data.user) };
}
export async function currentUser() {
  const result = await authClient.getSession({ query: { disableCookieCache: true } });
  if (result.error)
    throw new ApiError(result.error.status ?? 400, result.error.message ?? 'Không thể tải phiên.');
  if (!result.data) throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.');
  return { user: mapAuthUser(result.data.user) };
}
export async function logout() {
  requireAuthData(await authClient.signOut());
}
async function verifySensitiveChange(input: ProfileInput) {
  if (!input.email && !input.newPassword) return;
  if (!input.currentPassword) throw new ApiError(400, 'Cần mật khẩu hiện tại.');
  await api('/users/me/verify-password', {
    method: 'POST',
    body: { password: input.currentPassword },
  });
}
async function changePassword(input: ProfileInput) {
  if (!input.newPassword) return;
  requireAuthData(
    await authClient.changePassword({
      currentPassword: input.currentPassword ?? '',
      newPassword: input.newPassword,
      revokeOtherSessions: true,
    }),
  );
  await logout();
}
export async function updateUser(input: ProfileInput) {
  await verifySensitiveChange(input);
  requireAuthData(await authClient.updateUser({ name: input.displayName }));
  if (input.email) requireAuthData(await authClient.changeEmail({ newEmail: input.email }));
  const profile = await currentUser();
  if (input.email && profile.user.email !== input.email.toLowerCase())
    throw new ApiError(
      400,
      'Chưa thể đổi email. Email có thể đang được sử dụng hoặc cần xác minh.',
    );
  await changePassword(input);
  return { user: profile.user, requiresLogin: Boolean(input.newPassword) };
}
export const deleteUser = (password: string) =>
  api<void>('/users/me', { method: 'DELETE', body: { password } });
