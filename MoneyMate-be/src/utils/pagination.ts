import { z } from 'zod';
import { idSchema } from '../schemas/common.schema.ts';
import { AppError } from './app-error.ts';
import type {
  TransactionReadRecord,
  TransactionReadResult,
  TransactionCursor,
  FinanceReadQuery,
} from '../types/finance-read.types.ts';
const cursorSchema = z.object({ occurredAt: z.iso.datetime({ offset: true }), id: idSchema });
export function decodeTransactionCursor(value?: string): TransactionCursor | undefined {
  if (!value) return undefined;
  try {
    return cursorSchema.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')));
  } catch {
    throw new AppError(422, 'Con trỏ phân trang chưa hợp lệ.');
  }
}
function encodeTransactionCursor(record: TransactionReadRecord) {
  return Buffer.from(JSON.stringify({ occurredAt: record.occurredAt, id: record.id })).toString(
    'base64url',
  );
}
export function transactionPage(result: TransactionReadResult, query: FinanceReadQuery) {
  const hasMore = result.data.length > query.limit;
  const data = result.data.slice(0, query.limit);
  return {
    ...result,
    data,
    page: {
      hasMore,
      nextCursor: hasMore && data.length ? encodeTransactionCursor(data[data.length - 1]) : null,
    },
    pagination: { page: query.page, limit: query.limit, total: result.totals.total },
  };
}
