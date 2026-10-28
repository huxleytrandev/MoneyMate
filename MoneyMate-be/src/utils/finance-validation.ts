import { FINANCE_MESSAGES } from '../constants/finance.constant.ts';
import { AppError } from './app-error.ts';

export function requireRecord<Record>(record: Record | undefined): Record {
  if (!record) throw new AppError(404, FINANCE_MESSAGES.notFound);
  return record;
}
export function assertVersion(record: { version: number }, version: number) {
  if (record.version !== version) throw new AppError(409, FINANCE_MESSAGES.conflict);
}
export function assertNotFuture(occurredAt: string) {
  if (Date.parse(occurredAt) > Date.now() + 60000) throw new AppError(422, FINANCE_MESSAGES.date);
}
export function assertMovementReferences(
  result: { categoryValid: boolean; assetCount: number; openingValid: boolean },
  assetIds: string[],
) {
  if (!result.categoryValid || result.assetCount !== new Set(assetIds).size)
    throw new AppError(422, FINANCE_MESSAGES.invalidReference);
  if (!result.openingValid) throw new AppError(422, FINANCE_MESSAGES.date);
}
export function assertCategoryReference(valid: boolean) {
  if (!valid) throw new AppError(422, FINANCE_MESSAGES.invalidReference);
}
