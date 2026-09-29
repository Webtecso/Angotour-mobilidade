export function formatDateInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) return day;
  if (digits.length <= 4) return day + '/' + month;
  return day + '/' + month + '/' + year;
}

export function formatTimeInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 4);
  const hours = digits.slice(0, 2);
  const minutes = digits.slice(2, 4);

  if (digits.length <= 2) return hours;
  return hours + ':' + minutes;
}

export function isValidDateInput(value: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(value);
}

export function isValidTimeInput(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export function buildScheduledDate(dateStr: string, timeStr: string): Date | null {
  if (!isValidDateInput(dateStr) || !isValidTimeInput(timeStr)) return null;
  const [day, month, year] = dateStr.split('/').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}
