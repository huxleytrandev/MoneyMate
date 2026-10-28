import type { FinanceState } from '../types/finance.types';
import { monthLabel } from './date.ts';
import { categoryActual, totalsForMonth } from './finance.ts';
import { formatMoney } from './money.ts';

export function expensePlanStatus(state: FinanceState, month: string) {
  const plans = new Map(
    state.plans
      .filter((plan) => plan.month === month)
      .map((plan) => [plan.categoryId, plan.amount]),
  );
  return state.categories
    .filter((category) => category.kind === 'expense')
    .map((category) => ({
      category,
      actual: categoryActual(state, category.id, month),
      planned: plans.get(category.id),
    }));
}

// Bản xem trước chỉ đọc dữ liệu hiện có, chưa gửi câu hỏi tới dịch vụ AI.
export function buildAssistantReply(state: FinanceState, month: string, question: string) {
  const prompt = question
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const status = expensePlanStatus(state, month);
  const over = status.filter(({ planned, actual }) => planned !== undefined && actual > planned);
  const missing = status.filter(({ planned, actual }) => planned === undefined && actual > 0);
  const period = monthLabel(month);

  if (/nhac|thong bao/.test(prompt)) {
    return 'Tính năng nhắc nhở đang được hoàn thiện. Hiện tại bạn có thể mở Ngân sách để xem phần còn được chi của từng danh mục trong tháng.';
  }

  if (/vuot|qua tay/.test(prompt)) {
    if (over.length === 0) {
      return (
        period +
        ': chưa có danh mục chi tiêu đã lập kế hoạch nào bị vượt.' +
        (missing.length > 0
          ? '\n\nChưa đặt kế hoạch cho: ' +
            missing.map(({ category }) => category.name).join(', ') +
            '. Hãy bổ sung để so sánh đầy đủ.'
          : '\n\nBạn có thể xem số tiền còn được chi ở trang Ngân sách.')
      );
    }
    return (
      period +
      ', các danh mục chi vượt kế hoạch:\n\n' +
      over
        .map(
          ({ category, planned, actual }) =>
            '• ' +
            category.name +
            ': vượt ' +
            formatMoney(actual - (planned ?? 0)) +
            ' (dự kiến ' +
            formatMoney(planned ?? 0) +
            ', thực tế ' +
            formatMoney(actual) +
            ').',
        )
        .join('\n\n') +
      (missing.length > 0 ? '\n\nMột số danh mục chưa đặt kế hoạch nên chưa thể so sánh.' : '')
    );
  }

  if (/goi y|cat giam|ngan sach|ke hoach/.test(prompt)) {
    const largest = [...status]
      .filter(({ actual }) => actual > 0)
      .sort((asset, otherRecord) => otherRecord.actual - asset.actual)[0];
    return (
      (largest
        ? 'Trong ' +
          period.toLowerCase() +
          ', ' +
          largest.category.name +
          ' có chi tiêu cao nhất: ' +
          formatMoney(largest.actual) +
          '.\n\n'
        : 'Tháng này chưa có khoản chi nào được ghi lại.\n\n') +
      'Bạn có thể xem lại các khoản đã ghi, đặt kế hoạch cho từng danh mục và kiểm tra phần còn được chi trước khi phát sinh khoản mới.' +
      (over.length > 0 ? '\n\nHiện có ' + over.length + ' danh mục đã vượt kế hoạch.' : '') +
      (missing.length > 0
        ? '\n\nCó ' + missing.length + ' danh mục đã chi nhưng chưa đặt kế hoạch.'
        : '')
    );
  }

  if (/tom tat|phan tich|thu chi|thu nhap|chi tieu|thang/.test(prompt)) {
    const totals = totalsForMonth(state, month);
    const incomeCategories = new Set(
      state.categories
        .filter((category) => category.kind === 'income')
        .map((category) => category.id),
    );
    const incomePlan = state.plans
      .filter((plan) => plan.month === month && incomeCategories.has(plan.categoryId))
      .reduce((sum, plan) => sum + plan.amount, 0);
    const expensePlan = status.reduce((sum, item) => sum + (item.planned ?? 0), 0);
    return (
      period +
      ':\n\n' +
      '• Thu nhập thực tế: ' +
      formatMoney(totals.income) +
      '.\n' +
      '• Chi tiêu thực tế: ' +
      formatMoney(totals.expense) +
      '.\n' +
      '• Chênh lệch thu − chi: ' +
      formatMoney(totals.income - totals.expense) +
      '.\n\n' +
      'Tổng kế hoạch đã đặt: thu ' +
      formatMoney(incomePlan) +
      ', chi ' +
      formatMoney(expensePlan) +
      '.' +
      (missing.length > 0
        ? '\nMột số khoản chi chưa có kế hoạch theo danh mục; hãy bổ sung ở trang Ngân sách.'
        : '')
    );
  }

  return 'Đây là bản xem trước, chưa kết nối AI. Bạn có thể chọn “Tóm tắt thu chi”, hỏi danh mục nào chi vượt hoặc xem gợi ý quản lý ngân sách từ dữ liệu tài khoản.';
}
