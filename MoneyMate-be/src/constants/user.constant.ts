export const USER = {
  timezone: 'Asia/Ho_Chi_Minh',
  sessionDays: 7,
  passwordMin: 12,
  passwordMax: 128,
  messages: {
    unauthorized: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
    credentials: 'Email hoặc mật khẩu không đúng.',
    emailExists: 'Email này đã được sử dụng.',
    password: 'Mật khẩu hiện tại không đúng.',
  },
} as const;
export const DEFAULT_CATEGORIES = [
  { name: 'Ăn uống', kind: 'expense' },
  { name: 'Đi lại', kind: 'expense' },
  { name: 'Nhà ở', kind: 'expense' },
  { name: 'Mua sắm', kind: 'expense' },
  { name: 'Lương', kind: 'income' },
  { name: 'Làm thêm', kind: 'income' },
] as const;
