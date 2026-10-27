export interface LoginInput {
  email: string;
  password: string;
}
export interface RegisterInput extends LoginInput {
  displayName: string;
  confirmPassword: string;
}
export interface DemoSession {
  displayName: string;
  mode: 'demo';
}
