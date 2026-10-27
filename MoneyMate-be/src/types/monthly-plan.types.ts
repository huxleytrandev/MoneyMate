import type { RecordMetadata } from './common.types.ts';
import type { MoneyInput } from './common.types.ts';

export interface MonthlyPlan extends RecordMetadata {
  categoryId: string;
  kind: 'income' | 'expense';
  month: string;
  plannedAmount: bigint;
  note?: string;
}

export type CreateMonthlyPlanData = Omit<MonthlyPlan, keyof RecordMetadata>;
export type CreateMonthlyPlanInput = Omit<CreateMonthlyPlanData, 'plannedAmount'> & {
  plannedAmount: MoneyInput;
};
