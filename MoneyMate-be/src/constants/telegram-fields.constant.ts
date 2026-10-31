import type { ResourceName } from '../schemas/api.schema.ts';
export const BOT_FIELDS: Record<ResourceName | 'profile', { key: string; label: string }[]> = {
  transactions: [
    { key: 'kind', label: 'Loại giao dịch' },
    { key: 'title', label: 'Tên giao dịch' },
    { key: 'amount', label: 'Số tiền' },
    { key: 'categoryId', label: 'Danh mục' },
    { key: 'assetAccountId', label: 'Nguồn tiền' },
  ],
  assets: [
    { key: 'name', label: 'Tên tài sản' },
    { key: 'type', label: 'Loại tài sản' },
    { key: 'amount', label: 'Số dư ban đầu' },
  ],
  categories: [
    { key: 'name', label: 'Tên danh mục' },
    { key: 'kind', label: 'Thu nhập hay chi tiêu' },
  ],
  plans: [
    { key: 'categoryId', label: 'Danh mục kế hoạch' },
    { key: 'amount', label: 'Số tiền dự kiến' },
  ],
  transfers: [
    { key: 'amount', label: 'Số tiền chuyển' },
    { key: 'fromAssetAccountId', label: 'Nguồn chuyển' },
    { key: 'toAssetAccountId', label: 'Nguồn nhận' },
  ],
  adjustments: [
    { key: 'assetAccountId', label: 'Tài sản điều chỉnh' },
    { key: 'amount', label: 'Mức tăng/giảm (có thể âm)' },
    { key: 'note', label: 'Lý do điều chỉnh' },
  ],
  profile: [
    { key: 'displayName', label: 'Tên hiển thị' },
    { key: 'gender', label: 'Giới tính' },
    { key: 'dateOfBirth', label: 'Ngày sinh' },
  ],
};
export const BOT_EDIT_FIELDS: Record<ResourceName | 'profile', string[]> = {
  transactions: [
    'title',
    'kind',
    'amount',
    'categoryId',
    'assetAccountId',
    'date',
    'time',
    'note',
    'allocations',
  ],
  assets: ['name', 'type', 'date', 'note'],
  categories: ['name', 'kind', 'icon', 'color'],
  plans: ['amount', 'month', 'categoryId', 'note'],
  transfers: ['amount', 'fromAssetAccountId', 'toAssetAccountId', 'date', 'time', 'note'],
  adjustments: ['amount', 'assetAccountId', 'date', 'time', 'note'],
  profile: ['displayName', 'gender', 'dateOfBirth'],
};
export const BOT_FIELD_LABELS: Record<string, string> = {
  title: 'Nội dung',
  name: 'Tên',
  amount: 'Số tiền',
  categoryId: 'Danh mục',
  assetAccountId: 'Nguồn tiền',
  fromAssetAccountId: 'Nguồn chuyển',
  toAssetAccountId: 'Nguồn nhận',
  date: 'Ngày (YYYY-MM-DD)',
  time: 'Giờ (HH:mm)',
  month: 'Tháng (YYYY-MM)',
  note: 'Ghi chú',
  type: 'Loại tài sản',
  kind: 'Thu / Chi',
  icon: 'Icon (wallet, receipt, coffee…)',
  color: 'Màu #RRGGBB',
  displayName: 'Tên hiển thị',
  gender: 'Giới tính',
  dateOfBirth: 'Ngày sinh (YYYY-MM-DD)',
  allocations: 'Phân bổ nhiều nguồn',
};
