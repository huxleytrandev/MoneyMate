const timestamps = new Set([
  'createdAt',
  'updatedAt',
  'deletedAt',
  'openingAt',
  'occurredAt',
  'expiresAt',
]);
export function jsonSafe<T>(value: T): unknown {
  return JSON.parse(
    JSON.stringify(value, (key, item: unknown) => {
      if (typeof item === 'bigint') return item.toString();
      if (typeof item === 'string' && timestamps.has(key)) {
        const date = new Date(item);
        if (!Number.isNaN(date.getTime())) return date.toISOString();
      }
      return item;
    }),
  );
}
