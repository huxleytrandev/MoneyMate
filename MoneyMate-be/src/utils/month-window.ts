import { dayEnd } from './statistics.ts';
export function monthWindow(month: string, timezone: string) {
  const firstDay = new Date(month + '-01T12:00:00Z');
  const previousDay = new Date(firstDay.getTime() - 86400000).toISOString().slice(0, 10);
  const nextMonth = new Date(firstDay);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const lastDay = new Date(nextMonth.getTime() - 86400000).toISOString().slice(0, 10);
  return {
    start: new Date(dayEnd(previousDay, timezone) + 1).toISOString(),
    end: new Date(dayEnd(lastDay, timezone) + 1).toISOString(),
  };
}
