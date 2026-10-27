import type { loadSnapshot } from '../repositories/finance.repository.ts';
export type FinanceSnapshot = Awaited<ReturnType<typeof loadSnapshot>>;
