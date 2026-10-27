import type { Category } from './finance.types';
export interface BudgetRow {
  category: Category;
  planned?: number;
  actual: number;
}
export interface BudgetSummary {
  plannedCount: number;
  planned: number;
  actual: number;
  complete: boolean;
  remaining: number;
  overspent: boolean;
  maxValue: number;
  message: string;
}
