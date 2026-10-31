import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseMoney, findAmounts } from '../src/helpers/money.ts';
import { interpret } from '../src/services/intent.service.ts';
const parse = (text: string) =>
  interpret({ text, today: '2026-10-31', timezone: 'Asia/Ho_Chi_Minh' });
test('money uses exact integer arithmetic and rejects fractions of VND / overflow', () => {
  for (const [raw, amount] of [
    ['50k', '50000'],
    ['1,5 triệu', '1500000'],
    ['1.250.000', '1250000'],
    ['1tr5', '1500000'],
    ['-20k', '-20000'],
    ['0', '0'],
  ])
    assert.equal(parseMoney(raw), amount);
  for (const raw of ['1,2', 'NaN', '1e9', '9223372036854775808', 'abc'])
    assert.equal(parseMoney(raw), null);
  assert.equal(findAmounts('ăn trưa 1tr5 tiền mặt')[0]?.amount, '1500000');
});
test('expense and income extraction, source aliases, relative days and months', () => {
  const expense = parse('ăn trưa 50k tiền mặt hôm qua lúc 12h30');
  assert.equal(expense.action, 'create');
  assert.equal(expense.resource, 'transactions');
  assert.equal(expense.fields.amount, '50000');
  assert.equal(expense.fields.kind, 'expense');
  assert.equal(expense.fields.category, 'Ăn uống');
  assert.equal(expense.fields.date, '2026-10-30');
  assert.equal(expense.fields.time, '12:30');
  const income = parse('nhận lương 15 triệu vào VCB');
  assert.equal(income.fields.amount, '15000000');
  assert.equal(income.fields.kind, 'income');
  assert.equal(income.fields.asset, 'vcb');
  const plan = parse('đặt ngân sách ăn uống tháng sau 2 triệu');
  assert.equal(plan.resource, 'plans');
  assert.equal(plan.fields.month, '2026-11');
});
test('edits never invent a new title, month or asset type and multiple amounts require clarification', () => {
  const intent = parse('sửa giao dịch "Ăn trưa" thành 75000');
  assert.equal(intent.action, 'update');
  assert.equal(intent.fields.amount, '75000');
  assert.equal(intent.fields.title, undefined);
  assert.equal(intent.fields.month, undefined);
  assert.equal(parse('sửa tài sản "VCB" tên là Ngân hàng mới').fields.type, undefined);
  assert.ok(parse('ăn trưa 50k và cà phê 20k').fields.warning);
});
test('commands, security delegation, profile changes and transfers are recognized', () => {
  assert.equal(parse('/new assets').resource, 'assets');
  assert.equal(parse('/report').action, 'report');
  assert.equal(parse('/cancel').action, 'cancel');
  assert.equal(parse('đổi mật khẩu').action, 'security');
  assert.equal(parse('đổi tên tôi thành Nguyễn An').fields.displayName, 'Nguyễn An');
  const transfer = parse('chuyển tiền 500k từ tiền mặt sang Vietcombank');
  assert.equal(transfer.resource, 'transfers');
  assert.equal(transfer.fields.from, 'tiền mặt');
  assert.equal(transfer.fields.to, 'Vietcombank');
});
