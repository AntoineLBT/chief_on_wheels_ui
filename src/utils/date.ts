/** YYYY-MM-DD in the local timezone (toISOString would give the UTC day). */
export function localIsoDate(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
