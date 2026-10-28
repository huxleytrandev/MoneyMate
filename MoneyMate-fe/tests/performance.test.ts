import assert from 'node:assert/strict';
import { test } from 'node:test';
import { performance } from 'node:perf_hooks';
import {
  assetBalance,
  categoryActual,
  financeIndex,
  totalsForMonth,
} from '../src/helpers/finance.ts';
import { mapAdjustment, mapFinanceState } from '../src/helpers/api.ts';
import { transactionSections, mapTransactionPage } from '../src/helpers/transaction-page.ts';
import { buildAssistantReply } from '../src/helpers/assistant.ts';
import { dateKey, monthKey, setFinanceTimezone } from '../src/helpers/date.ts';
import type { FinanceState } from '../src/types/finance.types';
import type { ApiTransaction } from '../src/types/api.types';
import { createFinanceFixture } from './fixtures/finance.ts';

test('bounded snapshot uses server balance and monthly actuals rather than the loaded transaction page', () => {
  const month = monthKey(new Date());
  const state = createFinanceFixture();
  state.transactions = state.transactions.slice(0, 1);
  state.assets = state.assets.map((asset) => ({
    ...asset,
    currentBalance: asset.id === 'cash' ? 123456 : 0,
  }));
  state.summary = {
    month,
    income: 100000000,
    expense: 50000000,
    transactionCount: 20000,
    actualByCategory: { food: 42000000 },
  };
  assert.equal(assetBalance(state, 'cash'), 123456);
  assert.equal(categoryActual(state, 'food', month), 42000000);
  assert.deepEqual(totalsForMonth(state, month), { income: 100000000, expense: 50000000 });
  const reply = buildAssistantReply(state, month, 'Tóm tắt thu chi');
  assert.ok(reply.includes('100.000.000'));
  assert.ok(reply.includes('50.000.000'));
});

test('transaction sections preserve full matching day totals when only one cursor page is loaded', () => {
  const occurredAt = new Date().toISOString();
  const day = dateKey(new Date(occurredAt));
  const transaction: ApiTransaction = {
    id: 'entry',
    version: 1,
    title: 'Lunch',
    kind: 'expense',
    categoryId: 'food',
    amount: '10000',
    occurredAt,
    createdAt: occurredAt,
    updatedAt: occurredAt,
    allocations: [{ assetAccountId: 'cash', amount: '10000' }],
  };
  const page = mapTransactionPage({
    data: [transaction],
    page: { hasMore: true, nextCursor: 'next' },
    totals: { income: '0', expense: '200000000', total: 20000 },
    dayTotals: { [day]: { income: '0', expense: '12000000' } },
  });
  const section = transactionSections(page)[0];
  assert.equal(section.expense, 12000000);
  assert.equal(section.partial, false);
  assert.equal(page.totals.total, 20000);
  assert.equal(section.data.length, 1);
});

test('wire summary and balances reject unsafe integers instead of approximating', () => {
  const fixture = createFinanceFixture();
  const asset = fixture.assets[0];
  assert.throws(() =>
    mapFinanceState({
      assets: [
        {
          ...asset,
          id: 'cash',
          version: 1,
          openingValue: '0',
          currentBalance: '9007199254740993',
          openingAt: new Date().toISOString(),
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      categories: [],
      transactions: [],
      plans: [],
      adjustments: [],
      transfers: [],
      summary: {
        month: '2026-10',
        income: '0',
        expense: '0',
        actualByCategory: {},
        transactionCount: 0,
      },
    }),
  );
});

test('20,000 transactions are indexed once for repeated category and balance calculations', () => {
  const state: FinanceState = {
    assets: [{ id: 'cash', name: 'Cash', type: 'cash', openingValue: 1000000 }],
    categories: Array.from({ length: 20 }, (_, index) => ({
      id: 'category-' + index,
      name: 'Category ' + index,
      kind: 'expense' as const,
    })),
    transactions: [],
    plans: [],
    adjustments: [],
    transfers: [],
  };
  const occurredAt = '2026-10-10T12:00:00Z';
  state.transactions = Array.from({ length: 20000 }, (_, index) => ({
    id: String(index),
    title: 'Entry',
    kind: 'expense',
    categoryId: 'category-' + (index % 20),
    amount: 10,
    occurredAt,
    createdAt: occurredAt,
    updatedAt: occurredAt,
    allocations: [{ assetId: 'cash', amount: 10 }],
  }));
  const originalFormatter = Intl.DateTimeFormat;
  let constructions = 0;
  Intl.DateTimeFormat = new Proxy(originalFormatter, {
    construct(target, argumentsList) {
      constructions++;
      return Reflect.construct(target, argumentsList);
    },
  });
  try {
    setFinanceTimezone('Asia/Ho_Chi_Minh');
    const started = performance.now();
    for (const category of state.categories)
      assert.equal(categoryActual(state, category.id, '2026-10'), 10000);
    assert.equal(assetBalance(state, 'cash'), 800000);
    assert.equal(financeIndex(state), financeIndex(state));
    assert.equal(constructions, 1);
    console.info(
      'Frontend 20,000-row indexed totals: ' +
        (performance.now() - started).toFixed(1) +
        ' ms; one date formatter.',
    );
    setFinanceTimezone('America/New_York');
    assert.equal(categoryActual(state, 'category-0', '2026-10'), 10000);
    assert.equal(constructions, 2);
  } finally {
    Intl.DateTimeFormat = originalFormatter;
    setFinanceTimezone(undefined);
  }
});

test('targeted adjustment mapping preserves the asset, signed amount and version outside the snapshot', () => {
  const adjustment = mapAdjustment({
    id: 'older-adjustment',
    version: 12,
    assetAccountId: 'asset-outside-recent-history',
    deltaAmount: '-450000',
    reason: 'reconciliation',
    note: 'Old correction',
    occurredAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  });
  assert.equal(adjustment.assetId, 'asset-outside-recent-history');
  assert.equal(adjustment.delta, -450000);
  assert.equal(adjustment.version, 12);
});
