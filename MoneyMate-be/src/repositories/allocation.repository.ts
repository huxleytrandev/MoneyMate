import { and, eq, inArray } from 'drizzle-orm';
import { TransactionAllocationModel } from '../models/index.ts';
import type { Executor } from '../types/database.types.ts';
import type { AllocationData } from '../types/transaction-allocation.types.ts';
export function allocationRepository(database: Executor) {
  return {
    list: (userId: string) =>
      database
        .select()
        .from(TransactionAllocationModel)
        .where(eq(TransactionAllocationModel.userId, userId)),
    replace: async (userId: string, transactionId: string, allocations: AllocationData[]) => {
      await database
        .delete(TransactionAllocationModel)
        .where(
          and(
            eq(TransactionAllocationModel.userId, userId),
            eq(TransactionAllocationModel.transactionId, transactionId),
          ),
        );
      await database
        .insert(TransactionAllocationModel)
        .values(allocations.map((allocation) => ({ ...allocation, userId, transactionId })));
    },
    removeAll: (userId: string) =>
      database
        .delete(TransactionAllocationModel)
        .where(eq(TransactionAllocationModel.userId, userId)),
    forTransactions: (userId: string, ids: string[]) =>
      ids.length
        ? database
            .select()
            .from(TransactionAllocationModel)
            .where(
              and(
                eq(TransactionAllocationModel.userId, userId),
                inArray(TransactionAllocationModel.transactionId, ids),
              ),
            )
        : Promise.resolve([]),
  };
}
