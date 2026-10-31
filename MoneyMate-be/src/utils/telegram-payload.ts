import type { ResourceName } from '../schemas/api.schema.ts';
import { botTimestamp } from './telegram-input.ts';
interface PayloadContext {
  resource: ResourceName;
  fields: Record<string, string>;
  base: Record<string, unknown>;
  occurredAt: string;
  today: string;
  timezone: string;
}
function transactionPayload({ fields, base, occurredAt }: PayloadContext) {
  const previous = Array.isArray(base.allocations)
    ? (base.allocations as { assetAccountId: string; amount: string }[])
    : [];
  const allocations = fields.allocations
    ? JSON.parse(fields.allocations)
    : fields.assetAccountId
      ? [{ assetAccountId: fields.assetAccountId, amount: fields.amount ?? String(base.amount) }]
      : previous.map((entry) => ({
          assetAccountId: entry.assetAccountId,
          amount: fields.amount ?? String(entry.amount),
        }));
  return {
    title: fields.title ?? base.title,
    kind: fields.kind ?? base.kind,
    categoryId: fields.categoryId ?? base.categoryId,
    amount: fields.amount ?? base.amount,
    allocations,
    occurredAt,
  };
}
function assetPayload({ fields, base, today, timezone }: PayloadContext) {
  return {
    name: fields.name ?? base.name,
    type: fields.type ?? base.type,
    openingValue: fields.amount ?? base.openingValue,
    openingAt: fields.date
      ? botTimestamp(fields.date, '00:00', timezone)
      : (base.openingAt ?? botTimestamp(today, '00:00', timezone)),
  };
}
function categoryPayload({ fields, base }: PayloadContext) {
  return {
    name: fields.name ?? base.name,
    kind: fields.kind ?? base.kind,
    ...(fields.icon ? { icon: fields.icon } : {}),
    ...(fields.color ? { color: fields.color } : {}),
  };
}
function planPayload({ fields, base, today }: PayloadContext) {
  return {
    categoryId: fields.categoryId ?? base.categoryId,
    kind: base.kind,
    month: fields.month ? fields.month + '-01' : (base.month ?? today.slice(0, 7) + '-01'),
    plannedAmount: fields.amount ?? base.plannedAmount,
  };
}
function transferPayload({ fields, base, occurredAt }: PayloadContext) {
  return {
    amount: fields.amount ?? base.amount,
    fromAssetAccountId: fields.fromAssetAccountId ?? base.fromAssetAccountId,
    toAssetAccountId: fields.toAssetAccountId ?? base.toAssetAccountId,
    occurredAt,
  };
}
function adjustmentPayload({ fields, base, occurredAt }: PayloadContext) {
  return {
    assetAccountId: fields.assetAccountId ?? base.assetAccountId,
    deltaAmount: fields.amount ?? base.deltaAmount,
    reason: base.reason ?? 'valuation',
    note: fields.note ?? base.note,
    occurredAt,
  };
}
const builders = {
  transactions: transactionPayload,
  assets: assetPayload,
  categories: categoryPayload,
  plans: planPayload,
  transfers: transferPayload,
  adjustments: adjustmentPayload,
};
export function telegramPayload(context: PayloadContext): Record<string, unknown> {
  return builders[context.resource](context);
}
