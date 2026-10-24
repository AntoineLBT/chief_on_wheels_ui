export type Period = "year" | "month" | "week";

// ISO dates (YYYY-MM-DD) are handled as UTC midnights: no DST shift.
function parse(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day));
}

function format(date: Date) {
  return date.toISOString().slice(0, 10);
}

function utc(year: number, monthIndex: number, day: number) {
  return format(new Date(Date.UTC(year, monthIndex, day)));
}

/** First and last day of the year, month or ISO week (Monday → Sunday). */
export function periodRange(period: Period, isoDate: string) {
  const date = parse(isoDate);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  if (period === "year") {
    return { start: utc(year, 0, 1), end: utc(year, 11, 31) };
  }
  if (period === "month") {
    // Day 0 of the next month is the last day of this one.
    return { start: utc(year, month, 1), end: utc(year, month + 1, 0) };
  }
  const monday = date.getUTCDate() - ((date.getUTCDay() + 6) % 7);
  return { start: utc(year, month, monday), end: utc(year, month, monday + 6) };
}

/** Start of the period `step` periods before (< 0) or after (> 0). */
export function stepPeriod(period: Period, isoDate: string, step: number) {
  const start = parse(periodRange(period, isoDate).start);
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth();
  if (period === "year") return utc(year + step, 0, 1);
  if (period === "month") return utc(year, month + step, 1);
  return utc(year, month, start.getUTCDate() + 7 * step);
}
