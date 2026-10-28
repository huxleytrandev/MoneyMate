import type { FinanceSnapshot } from '../../src/types/finance-snapshot.types.ts';

export function createStatisticsFixture(
  count = 24,
  userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
): FinanceSnapshot {
  const identifier = (value: number) => userId.slice(0, 24) + value.toString(16).padStart(12, '0');
  const createdAt = '2024-12-01T00:00:00.000Z';
  const audit = { userId, createdAt, updatedAt: createdAt, deletedAt: null, version: 1 };
  const assets = ['Cash', 'Bank', 'Other'].map((name, index) => ({
    ...audit,
    id: identifier(index + 1),
    name,
    type: (['cash', 'bank', 'other'] as const)[index],
    openingValue: 10000000000000000n + BigInt(index),
    openingAt: '2024-12-31T00:00:00.000Z',
    note: null,
    isArchived: false,
  }));
  const categories = ['Food', 'Travel', 'Home', 'Salary'].map((name, index) => ({
    ...audit,
    id: identifier(index + 10),
    name,
    kind: index === 3 ? ('income' as const) : ('expense' as const),
    icon: null,
    color: null,
    sortOrder: index,
    isArchived: false,
  }));
  const transactions = Array.from({ length: count }, (_, index) => {
    const kind = index % 4 === 0 ? ('income' as const) : ('expense' as const);
    const category = categories[kind === 'income' ? 3 : index % 3];
    const occurredAt = new Date(
      Date.parse('2025-01-01T00:00:00Z') + (index % 365) * 86400000 + (index % 1440) * 60000,
    ).toISOString();
    const amount = 1000n + BigInt(index % 700);
    const id = identifier(index + 100);
    return {
      ...audit,
      id,
      categoryId: category.id,
      kind,
      amount,
      title: 'Fixture ' + index,
      note: null,
      occurredAt,
      allocations: [
        {
          id: identifier(index + 100000),
          userId,
          transactionId: id,
          assetAccountId: assets[index % assets.length].id,
          amount,
          createdAt,
          updatedAt: createdAt,
        },
      ],
    };
  });
  return {
    assets,
    categories,
    transactions,
    plans: categories.map((category, index) => ({
      ...audit,
      id: identifier(index + 300000),
      categoryId: category.id,
      kind: category.kind,
      month: '2025-03-01',
      plannedAmount: index === 0 ? 0n : 100000n,
      note: null,
    })),
    transfers: [
      {
        ...audit,
        id: identifier(400000),
        fromAssetAccountId: assets[0].id,
        toAssetAccountId: assets[1].id,
        amount: 20000n,
        occurredAt: '2025-03-09T07:30:00.000Z',
        note: null,
      },
    ],
    adjustments: [
      {
        ...audit,
        id: identifier(500000),
        assetAccountId: assets[2].id,
        deltaAmount: -450n,
        reason: 'reconciliation',
        note: 'Fixture',
        occurredAt: '2025-03-10T04:00:00.000Z',
      },
    ],
  };
}
