import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categorySchema, amountSchema, balanceSchema } from '../src/schemas/finance.schema.ts';
import { categoryPayload } from '../src/helpers/finance-payload.ts';
import { categoryColor, categoryIconName } from '../src/helpers/category.ts';
import { transactionQueryParams } from '../src/helpers/transaction-query.ts';
test('category appearance survives validation and update payload while existing categories get a usable icon', () => {
  const category = {
    id: 'food',
    version: 4,
    name: 'Ăn uống',
    kind: 'expense' as const,
    icon: 'utensils',
    color: '#0F766E',
  };
  const parsed = categorySchema.parse(category);
  assert.equal(categoryPayload({ ...category, ...parsed }).icon, 'utensils');
  assert.equal(categoryPayload(category).color, '#0F766E');
  assert.equal(categoryIconName({ name: 'Đi lại', kind: 'expense' }), 'bus');
  assert.equal(categoryColor({ color: 'javascript:invalid' }), '#0F766E');
  assert.equal(categorySchema.safeParse({ ...category, color: 'red' }).success, false);
});
test('VND inputs store raw integer values, preserve explicit zero and accept negative reconciled balances', () => {
  assert.equal(amountSchema.parse('1250000'), 1250000);
  assert.equal(amountSchema.parse('0'), 0);
  assert.equal(amountSchema.safeParse('1.250.000').success, false);
  assert.equal(amountSchema.safeParse('1250.50').success, false);
  assert.equal(balanceSchema.parse('-1250000'), -1250000);
  assert.equal(balanceSchema.safeParse('9007199254740993').success, false);
});
test('category detail query preserves owner-filtered API pagination and escapes search parameters', () => {
  const params = transactionQueryParams({
    month: '2026-10',
    categoryId: 'category-id',
    cursor: 'next+page',
    search: 'Ăn & uống',
    limit: 50,
  });
  assert.equal(params.get('categoryId'), 'category-id');
  assert.equal(params.get('cursor'), 'next+page');
  assert.equal(new URLSearchParams(params.toString()).get('search'), 'Ăn & uống');
  assert.equal(params.get('limit'), '50');
});
