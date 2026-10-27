import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAssistantReply, expensePlanStatus } from '../src/helpers/assistant.ts';
import type { FinanceState, Transaction } from '../src/types/finance.types';

function transaction(
  id: string,
  kind: 'income' | 'expense',
  amount: number,
  month: number,
): Transaction {
  const occurredAt = new Date(2026, month - 1, 15, 12).toISOString();
  return {
    id,
    title: id,
    categoryId: kind === 'expense' ? 'food' : 'salary',
    kind,
    amount,
    occurredAt,
    createdAt: occurredAt,
    updatedAt: occurredAt,
    allocations: [{ assetId: 'cash', amount }],
  };
}

function createState(): FinanceState {
  return {
    assets: [{ id: 'cash', name: 'Tiền mặt', type: 'cash', openingValue: 0 }],
    categories: [
      { id: 'food', name: 'Ăn uống', kind: 'expense' },
      { id: 'salary', name: 'Lương', kind: 'income' },
    ],
    transactions: [
      transaction('October salary', 'income', 10000000, 10),
      transaction('October meal', 'expense', 150000, 10),
      transaction('November meal', 'expense', 900000, 11),
    ],
    plans: [
      { categoryId: 'food', month: '2026-10', amount: 200000 },
      { categoryId: 'salary', month: '2026-10', amount: 12000000 },
      { categoryId: 'food', month: '2026-11', amount: 1000000 },
    ],
    adjustments: [],
  };
}

test('assistant summary uses actual transactions and plans in the requested month', () => {
  const state = createState();
  const before = JSON.stringify(state);
  const october = buildAssistantReply(state, '2026-10', 'Tóm tắt thu chi');
  assert.match(october, /Tháng 10, 2026/);
  assert.match(october, /Thu nhập thực tế: 10\.000\.000/);
  assert.match(october, /Chi tiêu thực tế: 150\.000/);
  assert.match(october, /Chênh lệch thu − chi: 9\.850\.000/);
  assert.match(october, /Tổng kế hoạch đã đặt: thu 12\.000\.000/);
  assert.match(october, /chi 200\.000/);
  assert.doesNotMatch(october, /900\.000/);

  const november = buildAssistantReply(state, '2026-11', 'Tóm tắt thu chi');
  assert.match(november, /Tháng 11, 2026/);
  assert.match(november, /Thu nhập thực tế: 0/);
  assert.match(november, /Chi tiêu thực tế: 900\.000/);
  assert.match(november, /Chênh lệch thu − chi: -900\.000/);
  assert.equal(JSON.stringify(state), before);
});

test('assistant distinguishes a zero expense plan from an absent plan', () => {
  const state = createState();
  const plan = state.plans.find((item) => item.categoryId === 'food' && item.month === '2026-10');
  assert.ok(plan);
  plan.amount = 0;
  assert.equal(expensePlanStatus(state, '2026-10')[0].planned, 0);
  const zeroPlan = buildAssistantReply(state, '2026-10', 'Tôi chi vượt mục nào?');
  assert.match(zeroPlan, /Ăn uống: vượt 150\.000/);
  assert.match(zeroPlan, /dự kiến 0/);

  state.plans = state.plans.filter((item) => item !== plan);
  assert.equal(expensePlanStatus(state, '2026-10')[0].planned, undefined);
  const noPlan = buildAssistantReply(state, '2026-10', 'Tôi chi vượt mục nào?');
  assert.match(noPlan, /Chưa đặt kế hoạch cho: Ăn uống/);
  assert.doesNotMatch(noPlan, /Ăn uống: vượt/);
});

test('assistant preview never promises reminders or pretends to answer arbitrary AI prompts', () => {
  const state = createState();
  const reminder = buildAssistantReply(state, '2026-10', 'Nhắc tôi khi gần hết ngân sách');
  assert.match(reminder, /Tính năng nhắc nhở đang được hoàn thiện/);
  assert.doesNotMatch(reminder, /sẽ nhắc|đã đặt|đã bật/i);

  const unknown = buildAssistantReply(state, '2026-10', 'Kể chuyện cổ tích');
  assert.match(unknown, /bản xem trước, chưa kết nối AI/);
  assert.match(unknown, /dữ liệu tài khoản/);
});
