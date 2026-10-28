import { getTableColumns, sql, type SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
export function sqlColumn(alias: string, name: string) {
  return sql`${sql.identifier(alias)}.${sql.identifier(name)}`;
}
export function jsonRecord(table: PgTable, alias: string): SQL {
  const values = Object.entries(getTableColumns(table)).flatMap(([name, column]) => {
    const reference = sqlColumn(alias, column.name);
    return [sql`${name}::text`, column.dataType === 'bigint' ? sql`${reference}::text` : reference];
  });
  return sql`jsonb_build_object(${sql.join(values, sql.raw(', '))})`;
}
