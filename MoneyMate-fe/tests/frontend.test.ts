import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loginSchema, registerSchema } from '../src/schemas/auth.schema.ts';
import { transactionSchema } from '../src/schemas/finance.schema.ts';
import {
  assetBalance,
  addTransaction,
  monthlyTransactions,
  categoryActual,
} from '../src/helpers/finance.ts';
import { monthKey, localDateTime, shiftMonth } from '../src/helpers/date.ts';
import { createFinanceFixture } from './fixtures/finance.ts';

test('auth validates and normalizes identity without modifying passwords', () => {
  assert.equal(
    loginSchema.parse({ email: ' USER@EXAMPLE.COM ', password: '  pass  ' }).email,
    'user@example.com',
  );
  assert.equal(
    loginSchema.parse({ email: 'a@example.com', password: '  pass  ' }).password,
    '  pass  ',
  );
  assert.equal(
    registerSchema.safeParse({
      displayName: 'A',
      email: 'a@example.com',
      password: '123456789012',
      confirmPassword: 'different',
    }).success,
    false,
  );
  assert.equal(
    registerSchema.safeParse({
      displayName: ' ',
      email: 'a@example.com',
      password: '123456789012',
      confirmPassword: '123456789012',
    }).success,
    false,
  );
});
test('transaction requires category, valid datetime and exact allocation', () => {
  const base = {
    title: '  Ăn trưa  ',
    categoryId: 'food',
    kind: 'expense',
    amount: '100000',
    date: '2026-10-27',
    time: '12:30',
    allocations: [
      { assetId: 'cash', amount: '40000' },
      { assetId: 'bank', amount: '60000' },
    ],
  };
  const parsed = transactionSchema.parse(base);
  assert.equal(parsed.amount, 100000);
  assert.equal(parsed.title, 'Ăn trưa');
  for (const change of [
    { categoryId: '' },
    { amount: '1.5' },
    { date: '2026-02-30' },
    { time: '25:00' },
    { allocations: [] },
    { amount: '90000' },
    {
      allocations: [
        { assetId: 'cash', amount: '50000' },
        { assetId: 'cash', amount: '50000' },
      ],
    },
  ])
    assert.equal(transactionSchema.safeParse({ ...base, ...change }).success, false);
});
test('split expense updates correct assets and category/month actual once', () => {
  const state = createFinanceFixture();
  const now = new Date().toISOString();
  const month = monthKey(new Date());
  const before = assetBalance(state, 'cash');
  const actual = categoryActual(state, 'food', month);
  const tx = {
    id: 'test',
    title: 'Test',
    categoryId: 'food',
    kind: 'expense' as const,
    amount: 100000,
    occurredAt: now,
    createdAt: now,
    updatedAt: now,
    allocations: [
      { assetId: 'cash', amount: 40000 },
      { assetId: 'bank', amount: 60000 },
    ],
  };
  const after = addTransaction(state, tx);
  assert.equal(assetBalance(after, 'cash'), before - 40000);
  assert.equal(assetBalance(after, 'bank'), assetBalance(state, 'bank') - 60000);
  assert.equal(categoryActual(after, 'food', month), actual + 100000);
  assert.equal(categoryActual(after, 'food', shiftMonth(month, -1)), 0);
  assert.throws(() => addTransaction(state, { ...tx, categoryId: 'salary' }));
  assert.throws(() =>
    addTransaction(state, { ...tx, allocations: [{ assetId: 'missing', amount: 100000 }] }),
  );
  assert.equal(monthlyTransactions(after, month).length, state.transactions.length + 1);
});
test('calendar helpers handle month boundaries and impossible local dates', () => {
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(localDateTime('2026-02-30', '12:00'), null);
  assert.ok(localDateTime('2026-10-27', '23:59'));
});
test('asset valuation adjustment changes assets without inflating actual income', () => {
  const state = createFinanceFixture();
  const month = monthKey(new Date());
  const actual = categoryActual(state, 'salary', month);
  const adjusted = {
    ...state,
    adjustments: [
      { id: 'v', assetId: 'other', delta: 2000000, occurredAt: new Date().toISOString() },
    ],
  };
  assert.equal(assetBalance(adjusted, 'other'), assetBalance(state, 'other') + 2000000);
  assert.equal(categoryActual(adjusted, 'salary', month), actual);
});
