import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exactNumber, mapFinanceState } from '../src/helpers/api.ts';
import { monthKey, dateKey, localDateTime, setFinanceTimezone } from '../src/helpers/date.ts';
import { assetBalance, monthlyTotals } from '../src/helpers/finance.ts';
test('API money mapping rejects unsafe integers instead of rounding', () => {
  assert.equal(exactNumber('1000000'), 1000000);
  assert.throws(() => exactNumber('9007199254740993'));
  assert.throws(() => exactNumber('1.5'));
});
test('account timezone aligns frontend months and form timestamps with backend', () => {
  try {
    setFinanceTimezone('Asia/Ho_Chi_Minh');
    assert.equal(monthKey(new Date('2026-10-31T18:00:00Z')), '2026-11');
    assert.equal(dateKey(new Date('2026-10-31T18:00:00Z')), '2026-11-01');
    assert.equal(localDateTime('2026-11-01', '01:00'), '2026-10-31T18:00:00.000Z');
    assert.equal(localDateTime('2026-02-30', '10:00'), null);
    setFinanceTimezone('America/New_York');
    assert.equal(localDateTime('2026-03-08', '02:30'), null);
  } finally {
    setFinanceTimezone(undefined);
  }
});
test('real API transfers affect source balances without inflating actual income', () => {
  const base = {
    id: 'cash',
    version: 1,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };
  const state = mapFinanceState({
    assets: [
      {
        ...base,
        name: 'Cash',
        type: 'cash',
        openingValue: '1000000',
        openingAt: base.createdAt,
        isArchived: false,
      },
      {
        ...base,
        id: 'bank',
        name: 'Bank',
        type: 'bank',
        openingValue: '0',
        openingAt: base.createdAt,
        isArchived: false,
      },
    ],
    categories: [],
    plans: [],
    transactions: [],
    adjustments: [],
    transfers: [
      {
        ...base,
        id: 'transfer',
        fromAssetAccountId: 'cash',
        toAssetAccountId: 'bank',
        amount: '100000',
        occurredAt: base.createdAt,
        note: null,
      },
    ],
  });
  assert.equal(assetBalance(state, 'cash'), 900000);
  assert.equal(assetBalance(state, 'bank'), 100000);
  assert.deepEqual(monthlyTotals(state.transactions), { income: 0, expense: 0 });
});
