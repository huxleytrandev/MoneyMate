import type { Database } from '../types/database.types.ts';
import type {
  ResourceListInput,
  ResourceFindInput,
  ReadUser,
} from '../types/finance-read.types.ts';
import { financeReadQuerySchema, stateWindowQuerySchema } from '../schemas/finance-read.schema.ts';
import { resourceReadRepository } from '../repositories/resource-read.repository.ts';
import { transactionReadRepository } from '../repositories/transaction-read.repository.ts';
import { stateWindowRepository } from '../repositories/state-window.repository.ts';
import { loadSnapshot } from '../repositories/finance.repository.ts';
import { requireRecord } from '../utils/finance-validation.ts';
import { transactionPage } from '../utils/pagination.ts';

export function financeReadService(database: Database) {
  async function list(input: ResourceListInput) {
    const query = financeReadQuerySchema.parse(input.query);
    if (input.resource === 'transactions') {
      return transactionPage(
        await transactionReadRepository(database).page(input.user, query),
        query,
      );
    }
    const result = await resourceReadRepository(database).page(
      input.user.id,
      input.resource,
      query,
    );
    return {
      data: result.data,
      pagination: { page: query.page, limit: query.limit, total: result.total },
    };
  }
  async function find(input: ResourceFindInput) {
    return requireRecord(
      await resourceReadRepository(database).find(input.userId, input.resource, input.id),
    );
  }
  async function state(input: { user: ReadUser; query: unknown }) {
    if (!input.query || typeof input.query !== 'object' || !('month' in input.query)) {
      return database.transaction((transaction) => loadSnapshot(transaction, input.user.id), {
        isolationLevel: 'repeatable read',
      });
    }
    const window = stateWindowQuerySchema.parse(input.query);
    const query = { ...window, page: 1 };
    const result = await stateWindowRepository(database).read(input.user, query);
    const page = transactionPage(result, query);
    return {
      assets: result.assets,
      categories: result.categories,
      plans: result.plans,
      transactions: page.data,
      transfers: result.transfers,
      adjustments: result.adjustments,
      summary: {
        month: window.month,
        ...result.totals,
        transactionCount: result.totals.total,
        actualByCategory: result.actualByCategory,
      },
      page: page.page,
    };
  }
  return { list, find, state };
}
