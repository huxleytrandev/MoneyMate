import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summarizeBudget } from '../src/helpers/budget.ts';
import { planDescription, planProgress } from '../src/helpers/plan.ts';
import { preparePlan, transactionPayload } from '../src/helpers/finance-payload.ts';
import { ApiError } from '../src/helpers/api-error.ts';
import { searchTransactions } from '../src/helpers/transaction-search.ts';
import { monthKey } from '../src/helpers/date.ts';
import { createFinanceFixture } from './fixtures/finance.ts';

test('budget distinguishes absent plans, a zero plan and income above target', () => {
  const category = { id: 'food', name: 'Ăn uống', kind: 'expense' as const };
  const absent = summarizeBudget([{ category, actual: 20 }], 'expense');
  assert.equal(absent.complete, false);
  assert.equal(absent.overspent, false);
  const zero = summarizeBudget([{ category, planned: 0, actual: 20 }], 'expense');
  assert.equal(zero.complete, true);
  assert.equal(zero.overspent, true);
  assert.equal(zero.remaining, -20);
  assert.equal(planProgress(0, 20), 1);
  assert.equal(planDescription('expense', undefined), 'Chưa lập kế hoạch');
  assert.equal(planDescription('income', -20), 'Vượt mục tiêu ');
  assert.equal(summarizeBudget([{ category, planned: 10, actual: 20 }], 'income').overspent, false);
});

test('plan preparation preserves version conflicts without changing its source state', () => {
  const state = createFinanceFixture();
  const original = structuredClone(state);
  const month = monthKey(new Date());
  assert.throws(
    () => preparePlan(state, { categoryId: 'food', month, amount: 20, expectedVersion: null }),
    (failure) => failure instanceof ApiError && failure.status === 409,
  );
  assert.throws(
    () =>
      preparePlan(state, { categoryId: 'food', month: '1900-01', amount: 20, expectedVersion: 1 }),
    (failure) => failure instanceof ApiError && failure.status === 409,
  );
  const prepared = preparePlan(state, { categoryId: 'food', month, amount: 0 });
  assert.equal(prepared.body.plannedAmount, '0');
  assert.equal(prepared.body.month, month + '-01');
  assert.deepEqual(state, original);
});

test('transaction search combines accent-free text, source and month without mutating state', () => {
  const state = createFinanceFixture();
  const original = structuredClone(state);
  const month = monthKey(new Date());
  const cash = searchTransactions(state, { month, filter: 'cash', query: 'di cho' });
  assert.deepEqual(
    cash.map((transaction) => transaction.id),
    ['groceries'],
  );
  assert.equal(searchTransactions(state, { month, filter: 'bank', query: 'di cho' }).length, 0);
  assert.equal(searchTransactions(state, { month: '1900-01', filter: 'all', query: '' }).length, 0);
  const payload = transactionPayload(state.transactions[0]);
  assert.equal(payload.amount, String(state.transactions[0].amount));
  assert.deepEqual(state, original);
});
