import type { ApiTransactionPage } from '../types/api.types';
import type { TransactionPage, TransactionDaySection } from '../types/transaction-page.types';
import { exactNumber, mapTransaction } from './api.ts';
import { groupTransactionsByDay } from './transaction-search.ts';
import { monthlyTotals } from './finance.ts';
export function mapTransactionPage(data: ApiTransactionPage): TransactionPage {
  return {
    data: data.data.map(mapTransaction),
    page: data.page,
    totals: {
      income: exactNumber(data.totals.income),
      expense: exactNumber(data.totals.expense),
      total: data.totals.total,
    },
    dayTotals: data.dayTotals
      ? Object.fromEntries(
          Object.entries(data.dayTotals).map(([day, total]) => [
            day,
            { income: exactNumber(total.income), expense: exactNumber(total.expense) },
          ]),
        )
      : undefined,
  };
}
export function transactionSections(page: TransactionPage): TransactionDaySection[] {
  return [...groupTransactionsByDay(page.data)].map(([day, transactions]) => ({
    key: day,
    data: transactions,
    ...(page.dayTotals?.[day] ?? monthlyTotals(transactions)),
    partial: !page.dayTotals?.[day] && page.page.hasMore,
  }));
}
