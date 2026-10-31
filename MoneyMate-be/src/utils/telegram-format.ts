import { TELEGRAM } from '../constants/telegram.constant.ts';
import type { BotRecord } from '../repositories/telegram-entity.repository.ts';
import type { BotOperation } from '../types/telegram.types.ts';
export const money = (value: unknown) => {
  try {
    return BigInt(String(value ?? '0')).toLocaleString('vi-VN') + ' ₫';
  } catch {
    return '—';
  }
};
export function recordLabel(record: BotRecord) {
  return String(record.name ?? record.title ?? record._label ?? record.note ?? record.id).slice(
    0,
    80,
  );
}
export function recordSummary(record: BotRecord) {
  const amount = record.amount ?? record.plannedAmount ?? record.openingValue ?? record.deltaAmount;
  return (
    recordLabel(record) +
    (amount === undefined ? '' : ' · ' + money(amount)) +
    ' [' +
    record.id.slice(0, 8) +
    ']'
  );
}
export function operationPreview(operation: BotOperation) {
  const title =
    operation.action === 'remove'
      ? 'Xóa / hoàn tác'
      : operation.action === 'reconcile'
        ? 'Đối soát số dư'
        : operation.action === 'create'
          ? 'Thêm mới'
          : operation.action === 'unlink'
            ? 'Hủy liên kết'
            : 'Cập nhật';
  const hidden = new Set(['id', 'version', 'avatarData']);
  const labels: Record<string, string> = {
    amount: 'Số tiền',
    openingValue: 'Số dư đầu',
    plannedAmount: 'Dự kiến',
    deltaAmount: 'Thay đổi',
    name: 'Tên',
    title: 'Nội dung',
    kind: 'Loại',
    month: 'Tháng',
    occurredAt: 'Thời điểm',
    openingAt: 'Bắt đầu',
    assetAccountId: 'Nguồn tiền',
    categoryId: 'Danh mục',
    fromAssetAccountId: 'Nguồn',
    toAssetAccountId: 'Đích',
    value: 'Số dư thực tế',
    note: 'Ghi chú',
    gender: 'Giới tính',
    dateOfBirth: 'Ngày sinh',
    displayName: 'Tên hiển thị',
    isArchived: 'Lưu trữ',
  };
  const rows = Object.entries(operation.input)
    .filter(([key]) => !hidden.has(key))
    .map(([key, value]) => {
      if (key === 'allocations' && Array.isArray(value))
        return (
          'Phân bổ: ' +
          value
            .map(
              (entry: { assetAccountId?: string; amount?: string }) =>
                (entry.assetAccountId?.slice(0, 8) ?? '') + ': ' + money(entry.amount),
            )
            .join('; ')
        );
      const rendered = ['amount', 'openingValue', 'plannedAmount', 'deltaAmount', 'value'].includes(
        key,
      )
        ? money(value)
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
      return (labels[key] ?? key) + ': ' + rendered;
    });
  if ('avatarData' in operation.input)
    rows.push('Ảnh đại diện: ' + (operation.input.avatarData ? 'cập nhật ảnh JPEG' : 'không có'));
  return [
    title + ' · ' + TELEGRAM.labels[operation.resource],
    operation.summary ?? '',
    operation.recordId ? 'Mã: ' + operation.recordId : '',
    ...rows,
    'Chỉ ghi dữ liệu sau khi bạn bấm Xác nhận. Hiệu lực 10 phút.',
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 3500);
}
