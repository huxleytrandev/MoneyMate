import type { financeService } from '../services/finance.service.ts';
import type { financeReadService } from '../services/finance-read.service.ts';
export interface FinanceControllerServices {
  commands: ReturnType<typeof financeService>;
  queries: ReturnType<typeof financeReadService>;
}
