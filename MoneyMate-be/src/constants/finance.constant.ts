export const ASSET_TYPES = ['cash', 'bank', 'other'] as const;
export const TRANSACTION_KINDS = ['income', 'expense'] as const;
export const ADJUSTMENT_REASONS = ['valuation', 'reconciliation'] as const;
export const REPORT_PERIODS = ['week', 'month', 'quarter', 'year'] as const;
export const FINANCE_MESSAGES = {
  notFound: 'Dữ liệu không tồn tại.',
  conflict: 'Dữ liệu đã thay đổi. Hãy tải lại và thử lại.',
  usedAsset: 'Tài sản đã có phát sinh. Hãy đối soát số dư hoặc lưu trữ thay vì xóa.',
  usedCategory: 'Danh mục đã được sử dụng. Hãy lưu trữ thay vì xóa hoặc đổi loại.',
  duplicateCategory: 'Danh mục cùng tên và loại đã tồn tại.',
  invalidReference:
    'Danh mục hoặc nguồn tiền không thuộc tài khoản của bạn, đã bị xóa hoặc lưu trữ.',
  date: 'Ngày phát sinh phải từ ngày bắt đầu tài sản và không ở tương lai.',
  unavailable: 'Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.',
} as const;

export const RESOURCE_NAMES = [
  'assets',
  'categories',
  'plans',
  'transactions',
  'transfers',
  'adjustments',
] as const;
