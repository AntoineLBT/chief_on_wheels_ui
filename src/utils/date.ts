/** YYYY-MM-DD in the local timezone (toISOString would give the UTC day). */
export function localIsoDate(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The first time on a `step`-minute boundary at or after `date`, wrapping past midnight. */
export function ceilToMinuteStep(date: Date, step: number) {
  const total =
    date.getHours() * 60 + Math.ceil(date.getMinutes() / step) * step;
  return { hours: Math.floor(total / 60) % 24, minutes: total % 60 };
}
