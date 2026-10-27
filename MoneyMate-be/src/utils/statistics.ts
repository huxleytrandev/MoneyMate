import { localDay } from './finance.ts';
// Calendar boundary in the user's IANA timezone (including daylight-saving changes).
export function dayEnd(day: string, timezone: string) {
  const anchor = Date.parse(day + 'T12:00:00Z');
  let lo = anchor - 36 * 3600000,
    hi = anchor + 36 * 3600000;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (localDay(new Date(mid).toISOString(), timezone) <= day) lo = mid;
    else hi = mid;
  }
  return lo;
}
