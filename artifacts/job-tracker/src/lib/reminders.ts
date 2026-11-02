import type { Reminder } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export type DueBucket = "overdue" | "today" | "week" | "later";

export function dueBucket(dueAt: string, now = new Date()): DueBucket {
  const due = new Date(dueAt);
  const today = startOfDay(now);
  const tomorrow = new Date(today.getTime() + DAY);
  if (due < now) return "overdue";
  if (due < tomorrow) return "today";
  if (due < new Date(today.getTime() + 8 * DAY)) return "week";
  return "later";
}

export function formatDue(dueAt: string, now = new Date()): string {
  const due = new Date(dueAt);
  const days = Math.round((startOfDay(due).getTime() - startOfDay(now).getTime()) / DAY);
  const time = due.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Tomorrow, ${time}`;
  if (days === -1) return `Yesterday, ${time}`;
  if (days < 0) return `${-days} days overdue`;
  if (days < 7) return `${due.toLocaleDateString("en-US", { weekday: "long" })}, ${time}`;
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: due.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

/** Local 9:00 AM, `days` from today. */
export function daysFromNowAt9(days: number): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d;
}

/** Value for <input type="datetime-local"> in the browser's timezone. */
export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const QUICK_PICKS: { label: string; days: number }[] = [
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "In 1 week", days: 7 },
  { label: "In 2 weeks", days: 14 },
];

export const SNOOZE_OPTIONS: { label: string; days: number }[] = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
];

export function isDueSoon(r: Reminder, now = new Date()) {
  const b = dueBucket(r.dueAt, now);
  return b === "overdue" || b === "today";
}
