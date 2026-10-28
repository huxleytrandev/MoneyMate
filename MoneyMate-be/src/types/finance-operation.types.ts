import type { repositories } from '../repositories/finance.repository.ts';
import type { financeWriteRepository } from '../repositories/finance-write.repository.ts';
import type { ResourceName } from '../schemas/api.schema.ts';

type FinanceWriteRepository = ReturnType<typeof financeWriteRepository>;
export type CurrentFinanceRecord = NonNullable<
  Awaited<ReturnType<FinanceWriteRepository['findRecord']>>
>;
export interface FinanceOperationContext {
  userId: string;
  repositories: ReturnType<typeof repositories>;
  queries: FinanceWriteRepository;
  recordId?: string;
  current?: CurrentFinanceRecord;
}
export interface CreateFinanceCommand {
  userId: string;
  resource: ResourceName;
  input: unknown;
}
export interface UpdateFinanceCommand extends CreateFinanceCommand {
  recordId: string;
}
export interface RecordWriter<Input, Record> {
  create: (userId: string, data: Input) => Promise<Record>;
  update: (userId: string, id: string, version: number, data: Input) => Promise<Record | undefined>;
}
