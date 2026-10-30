import type { Asset, TransactionKind } from '../types/finance.types';
export function availableSources(assets: Asset[], type: Asset['type']) {
  return assets.filter((asset) => !asset.isArchived && asset.type === type);
}
export function defaultSource(assets: Asset[], selected: string) {
  if (assets.some((asset) => asset.id === selected)) return selected;
  if (selected) return '';
  return assets.length === 1 ? assets[0].id : '';
}
export function cashAllocations(input: {
  assets: Asset[];
  amount: number;
  kind: TransactionKind;
  balances: ReadonlyMap<string, number>;
}) {
  const { assets, amount, kind, balances } = input;
  if (!assets.length || !Number.isSafeInteger(amount) || amount <= 0) return [];
  if (kind === 'income' || assets.length === 1)
    return [{ assetId: assets[0].id, amount: String(amount) }];
  let remaining = amount;
  const allocations = new Map<string, number>();
  for (const asset of assets) {
    const allocated = Math.min(remaining, Math.max(0, balances.get(asset.id) ?? 0));
    if (allocated > 0) allocations.set(asset.id, allocated);
    remaining -= allocated;
    if (remaining === 0) break;
  }
  if (remaining > 0)
    allocations.set(assets[0].id, (allocations.get(assets[0].id) ?? 0) + remaining);
  return [...allocations].map(([assetId, value]) => ({ assetId, amount: String(value) }));
}
