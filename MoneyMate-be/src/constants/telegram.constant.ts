export const TELEGRAM = {
  linkMs: 10 * 60 * 1000,
  draftMs: 10 * 60 * 1000,
  textLimit: 3800,
  resources: ['transactions', 'assets', 'categories', 'plans', 'transfers', 'adjustments'] as const,
  labels: {
    transactions: 'Giao dịch',
    assets: 'Tài sản',
    categories: 'Danh mục',
    plans: 'Kế hoạch tháng',
    transfers: 'Chuyển nội bộ',
    adjustments: 'Điều chỉnh',
    profile: 'Hồ sơ',
    balance: 'Số dư',
  },
};
export const TELEGRAM_MENU = [
  [
    { text: '💰 Số dư', callback_data: 'list:balance' },
    { text: '📊 Báo cáo', callback_data: 'report:balance' },
  ],
  [
    { text: '🧾 Giao dịch', callback_data: 'list:transactions' },
    { text: '➕ Ghi thu/chi', callback_data: 'create:transactions' },
  ],
  [
    { text: '🏦 Tài sản', callback_data: 'list:assets' },
    { text: '🗂 Danh mục', callback_data: 'list:categories' },
  ],
  [
    { text: '🎯 Kế hoạch', callback_data: 'list:plans' },
    { text: '🔁 Chuyển tiền', callback_data: 'list:transfers' },
  ],
  [
    { text: '⚖️ Điều chỉnh', callback_data: 'list:adjustments' },
    { text: '👤 Hồ sơ', callback_data: 'show:profile' },
  ],
];
