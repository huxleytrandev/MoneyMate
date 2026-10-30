import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calendarKey, calendarValue, selectedTime } from '../src/helpers/date-selection.ts';
import { availableSources, defaultSource, cashAllocations } from '../src/helpers/payment-source.ts';
import { profileSchema } from '../src/schemas/profile.schema.ts';
import { categoryIconName } from '../src/helpers/category.ts';
import type { Asset } from '../src/types/finance.types';
test('calendar selection preserves date-only birthdays and rejects impossible dates', () => {
  const valid = calendarValue('2000-02-29');
  assert.ok(valid);
  assert.equal(calendarKey(valid), '2000-02-29');
  for (const invalid of ['2001-02-29', '2026-02-30', '2026-13-01', 'invalid', '1899-12-31'])
    assert.equal(calendarValue(invalid), undefined);
  assert.equal(calendarKey(new Date(NaN)), '');
  const profile = { displayName: 'Name', gender: null, dateOfBirth: null, avatarData: null };
  assert.equal(profileSchema.safeParse({ ...profile, dateOfBirth: '2999-01-01' }).success, false);
  assert.equal(profileSchema.safeParse({ ...profile, dateOfBirth: '2000-02-29' }).success, true);
});
test('clock confirms only integer hours 0..23 and minutes 0..59', () => {
  assert.equal(selectedTime({ hours: 0, minutes: 0 }), '00:00');
  assert.equal(selectedTime({ hours: 23, minutes: 59 }), '23:59');
  for (const input of [
    { hours: 24, minutes: 0 },
    { hours: -1, minutes: 0 },
    { hours: 12, minutes: 60 },
    { hours: NaN, minutes: 1 },
    { hours: 1, minutes: 1.5 },
  ])
    assert.equal(selectedTime(input), null);
});
test('payment defaults exclude archives, preserve explicit bank choices and require a choice for multiple banks', () => {
  const assets: Asset[] = [
    { id: 'cash', name: 'Cash', type: 'cash', openingValue: 100 },
    { id: 'bank1', name: 'Bank 1', type: 'bank', openingValue: 100 },
    { id: 'bank2', name: 'Bank 2', type: 'bank', openingValue: 100, isArchived: true },
  ];
  const banks = availableSources(assets, 'bank');
  assert.equal(defaultSource(banks, ''), 'bank1');
  assert.equal(defaultSource(banks, 'bank2'), '');
  const multiple = [...banks, { ...assets[2], isArchived: false }];
  assert.equal(defaultSource(multiple, ''), '');
  assert.equal(defaultSource(multiple, 'bank2'), 'bank2');
});
test('cash automatic allocation preserves exact totals for income, expenses and insufficient funds', () => {
  const assets: Asset[] = [
    { id: 'a', name: 'Cash a', type: 'cash', openingValue: 40 },
    { id: 'b', name: 'Cash b', type: 'cash', openingValue: 60 },
  ];
  const balances = new Map([
    ['a', 40],
    ['b', 60],
  ]);
  assert.deepEqual(cashAllocations({ assets, balances, amount: 80, kind: 'expense' }), [
    { assetId: 'a', amount: '40' },
    { assetId: 'b', amount: '40' },
  ]);
  const overdraft = cashAllocations({ assets, balances, amount: 150, kind: 'expense' });
  assert.equal(
    overdraft.reduce((sum, entry) => sum + Number(entry.amount), 0),
    150,
  );
  assert.deepEqual(cashAllocations({ assets, balances, amount: 80, kind: 'income' }), [
    { assetId: 'a', amount: '80' },
  ]);
  assert.deepEqual(cashAllocations({ assets, balances, amount: NaN, kind: 'expense' }), []);
});
test('income categories use earnings icons independently of expense name suggestions', () => {
  assert.equal(categoryIconName({ name: 'Thu nhập khác', kind: 'income' }), 'wallet');
  assert.equal(categoryIconName({ name: 'Lương', kind: 'income' }), 'briefcase');
  assert.equal(categoryIconName({ name: 'Ăn uống', kind: 'expense' }), 'utensils');
});
