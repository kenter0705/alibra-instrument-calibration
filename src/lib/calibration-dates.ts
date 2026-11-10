/** Parse an HTML date input and add calendar months without month-end overflow. */
export function addCalibrationMonths(dateValue: string, months: number): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !Number.isInteger(months) || months < 1 || months > 1200) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  const monthIndex = year * 12 + month - 1 + months;
  const targetYear = Math.floor(monthIndex / 12);
  const targetMonth = monthIndex % 12;
  const maxDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, targetMonth, Math.min(day, maxDay)));
}

export function parseCalibrationDate(dateValue: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return null;
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateValue ? null : date;
}
