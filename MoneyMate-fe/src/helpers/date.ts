let timezone: string | undefined;
let partsFormatter: Intl.DateTimeFormat | undefined;
let displayFormatter: Intl.DateTimeFormat | undefined;
export function getFinanceTimezone() {
  return timezone;
}
export function setFinanceTimezone(value: string | undefined) {
  timezone = value;
  partsFormatter = undefined;
  displayFormatter = undefined;
}
function dateParts(date: Date) {
  if (!timezone)
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
    };
  partsFormatter ??= new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = partsFormatter.formatToParts(date);
  const component = (name: string) => Number(parts.find((part) => part.type === name)?.value);
  return {
    year: component('year'),
    month: component('month'),
    day: component('day'),
    hour: component('hour'),
    minute: component('minute'),
  };
}
const pad = (value: number) => String(value).padStart(2, '0');
export function monthKey(date: Date) {
  const parts = dateParts(date);
  return parts.year + '-' + pad(parts.month);
}
export function dateKey(date: Date) {
  const parts = dateParts(date);
  return parts.year + '-' + pad(parts.month) + '-' + pad(parts.day);
}
export function timeKey(date: Date) {
  const parts = dateParts(date);
  return pad(parts.hour) + ':' + pad(parts.minute);
}
export function shiftMonth(month: string, direction: number) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + direction, 1)).toISOString().slice(0, 7);
}
export function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-');
  return 'Tháng ' + Number(monthNumber) + ', ' + year;
}
function zonedTimestamp(target: number) {
  let candidate = target;
  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = dateParts(new Date(candidate));
    const observed = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    candidate += target - observed;
  }
  return new Date(candidate);
}
export function localDateTime(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  if (year < 100 || hour > 23 || minute > 59) return null;
  const timestamp = timezone
    ? zonedTimestamp(Date.UTC(year, month - 1, day, hour, minute))
    : new Date(year, month - 1, day, hour, minute);
  const parts = dateParts(timestamp);
  const matches =
    parts.year === year &&
    parts.month === month &&
    parts.day === day &&
    parts.hour === hour &&
    parts.minute === minute;
  return matches ? timestamp.toISOString() : null;
}
export function formatDateTime(value: string) {
  displayFormatter ??= new Intl.DateTimeFormat('vi-VN', {
    ...(timezone ? { timeZone: timezone } : {}),
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return displayFormatter.format(new Date(value));
}
