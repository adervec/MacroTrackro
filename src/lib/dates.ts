// A calendar day is the reader's LOCAL day, kept as "YYYY-MM-DD" (house standard 10).
const pad = (n: number) => String(n).padStart(2, "0");

export const toDay = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = (): string => toDay(new Date());
/** A stored day back as a Date at local midnight. */
export const fromDay = (day: string): Date => new Date(day + "T00:00:00");

export function addDays(day: string, n: number): string {
  const d = fromDay(day);
  d.setDate(d.getDate() + n);
  return toDay(d);
}
