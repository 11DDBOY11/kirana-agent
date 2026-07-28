export interface DateRange { start: Date; end: Date; label: string; }

const INDIA_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function indiaDateParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function indiaMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) - INDIA_OFFSET_MS);
}

export function currentMonthRange(now = new Date()): DateRange {
  const { year, month } = indiaDateParts(now);
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  return { start: indiaMidnight(year, month, 1), end: indiaMidnight(nextMonth.year, nextMonth.month, 1), label: "this month" };
}

export function todayRange(now = new Date()): DateRange {
  const { year, month, day } = indiaDateParts(now);
  const start = indiaMidnight(year, month, day);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000), label: "today" };
}

export function lastSevenDaysRange(now = new Date()): DateRange {
  const today = todayRange(now);
  return { start: new Date(today.start.getTime() - 6 * 24 * 60 * 60 * 1000), end: today.end, label: "last 7 days" };
}
