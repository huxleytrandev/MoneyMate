export interface LoginInput {
  email: string;
  password: string;
}
export interface RegisterInput extends LoginInput {
  displayName: string;
  confirmPassword: string;
}
export interface UserSession {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}
export interface AuthResult {
  user: UserSession;
}

export interface ProfileInput {
  displayName: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}
