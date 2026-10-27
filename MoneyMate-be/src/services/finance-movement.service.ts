import { z } from 'zod';
import { idSchema } from '../schemas/common.schema.ts';
import type { ResourceName } from '../schemas/api.schema.ts';
import type { FinanceOperationContext } from '../types/finance-operation.types.ts';

const movementReferenceSchema = z.object({
  allocations: z.array(z.object({ assetAccountId: idSchema })).optional(),
  assetAccountId: idSchema.optional(),
  fromAssetAccountId: idSchema.optional(),
  toAssetAccountId: idSchema.optional(),
});
const movementResources = new Set<ResourceName>(['transactions', 'transfers', 'adjustments']);

function movementAssetIds(input: unknown) {
  const references = movementReferenceSchema.parse(input);
  return [
    ...(references.allocations?.map((allocation) => allocation.assetAccountId) ?? []),
    references.assetAccountId,
    references.fromAssetAccountId,
    references.toAssetAccountId,
  ].filter((assetId): assetId is string => !!assetId);
}
export async function touchMovementAssets(
  context: FinanceOperationContext,
  resource: ResourceName,
  records: unknown[],
) {
  if (!movementResources.has(resource)) return;
  const assetIds = [...new Set(records.flatMap(movementAssetIds))];
  await context.repositories.assets.touchAll(context.userId, assetIds);
}
