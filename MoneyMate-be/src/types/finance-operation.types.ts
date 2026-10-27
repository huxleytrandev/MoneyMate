import type { repositories } from '../repositories/finance.repository.ts';
import type { FinanceSnapshot } from './finance-snapshot.types.ts';
import type { ResourceName } from '../schemas/api.schema.ts';

export interface FinanceOperationContext {
  userId: string;
  state: FinanceSnapshot;
  repositories: ReturnType<typeof repositories>;
  recordId?: string;
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
