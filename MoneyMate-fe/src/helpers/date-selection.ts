export function calendarValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  const result = new Date(year, month - 1, day, 12);
  return year >= 1900 &&
    result.getFullYear() === year &&
    result.getMonth() === month - 1 &&
    result.getDate() === day
    ? result
    : undefined;
}
export function calendarKey(date: Date) {
  if (!Number.isFinite(date.getTime())) return '';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
export function selectedTime({ hours, minutes }: { hours: number; minutes: number }) {
  if (
    !Number.isInteger(hours) ||
    hours < 0 ||
    hours > 23 ||
    !Number.isInteger(minutes) ||
    minutes < 0 ||
    minutes > 59
  )
    return null;
  return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
}
