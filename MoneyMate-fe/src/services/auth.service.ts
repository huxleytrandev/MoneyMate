import type { LoginInput, RegisterInput } from '../types/auth.types';
// Contract placeholder: backend currently has no auth endpoints. Never fake success or store passwords.
export async function login(_input: LoginInput): Promise<never> {
  throw new Error('Đăng nhập đang được hoàn thiện. Bạn có thể khám phá bản trải nghiệm.');
}
export async function register(_input: RegisterInput): Promise<never> {
  throw new Error('Đăng ký đang được hoàn thiện. Chưa có tài khoản nào được tạo.');
}
