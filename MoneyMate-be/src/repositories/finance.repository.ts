import { sql } from 'drizzle-orm';
import type { Database, DatabaseTransaction, Executor } from '../types/database.types.ts';
import { assetRepository } from './asset.repository.ts';
import { categoryRepository } from './category.repository.ts';
import { planRepository } from './plan.repository.ts';
import { transactionRepository } from './transaction.repository.ts';
import { transferRepository } from './transfer.repository.ts';
import { adjustmentRepository } from './adjustment.repository.ts';
import { allocationRepository } from './allocation.repository.ts';
export function repositories(database: Executor) {
  return {
    assets: assetRepository(database),
    categories: categoryRepository(database),
    plans: planRepository(database),
    transactions: transactionRepository(database),
    transfers: transferRepository(database),
    adjustments: adjustmentRepository(database),
    allocations: allocationRepository(database),
  };
}
export async function loadSnapshot(database: Executor, userId: string) {
  const financeRepositories = repositories(database);
  const assets = await financeRepositories.assets.list(userId),
    categories = await financeRepositories.categories.list(userId),
    plans = await financeRepositories.plans.list(userId),
    transactions = await financeRepositories.transactions.list(userId),
    transfers = await financeRepositories.transfers.list(userId),
    adjustments = await financeRepositories.adjustments.list(userId),
    allocations = await financeRepositories.allocations.list(userId);
  return {
    assets,
    categories,
    plans,
    transactions: transactions.map((transaction) => ({
      ...transaction,
      allocations: allocations.filter((allocation) => allocation.transactionId === transaction.id),
    })),
    transfers,
    adjustments,
  };
}
export function withUserWrite<T>(
  database: Database,
  userId: string,
  work: (transaction: DatabaseTransaction) => Promise<T>,
) {
  return database.transaction(async (transaction) => {
    await transaction.execute(sql`select pg_advisory_xact_lock(hashtextextended(${userId},0))`);
    return work(transaction);
  });
}
