import { sql, type SQL } from 'drizzle-orm';

const timezoneIdentifiers = new Map<string, string>();
function timezoneIdentifier(timezone: string) {
  const cached = timezoneIdentifiers.get(timezone);
  if (cached) return cached;
  const identifier = new Intl.DateTimeFormat('en', { timeZone: timezone }).resolvedOptions()
    .timeZone;
  if (timezoneIdentifiers.size >= 32)
    timezoneIdentifiers.delete(timezoneIdentifiers.keys().next().value!);
  timezoneIdentifiers.set(timezone, identifier);
  return identifier;
}
// Intl aliases such as CST/IST differ from PostgreSQL abbreviations.
// ISO fixed offsets also need the interval overload to avoid PostgreSQL's POSIX sign reversal.
export function sqlLocalTime(expression: SQL, timezone: string): SQL {
  const identifier = timezoneIdentifier(timezone);
  const offset = /^([+-])(\d{2})(?::?(\d{2}))?$/.exec(identifier);
  if (offset) {
    const interval = offset[1] + offset[2] + ':' + (offset[3] ?? '00');
    return sql`${expression} AT TIME ZONE ${interval}::interval`;
  }
  return sql`${expression} AT TIME ZONE ${identifier}`;
}
