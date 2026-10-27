export function monthKey(date: Date) {
  return String(date.getFullYear()) + '-' + String(date.getMonth() + 1).padStart(2, '0');
}
export function dateKey(date: Date) {
  return monthKey(date) + '-' + String(date.getDate()).padStart(2, '0');
}
export function timeKey(date: Date) {
  return (
    String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0')
  );
}
export function shiftMonth(month: string, direction: number) {
  const [year, m] = month.split('-').map(Number);
  return monthKey(new Date(year, m - 1 + direction, 1));
}
export function monthLabel(month: string) {
  const [year, m] = month.split('-');
  return 'Tháng ' + Number(m) + ', ' + year;
}
export function localDateTime(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const value = new Date(y, m - 1, d, h, min);
  return value.getFullYear() === y &&
    value.getMonth() === m - 1 &&
    value.getDate() === d &&
    h < 24 &&
    min < 60
    ? value.toISOString()
    : null;
}
export function formatDateTime(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
