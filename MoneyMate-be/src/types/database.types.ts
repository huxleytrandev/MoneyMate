import type { createDatabase } from '../configs/database.ts';
export type Database = ReturnType<typeof createDatabase>['db'];
export type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];
export type Executor = Database | DatabaseTransaction;
