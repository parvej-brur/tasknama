// Local calendar date as `YYYY-MM-DD`. Never a UTC instant.
export type DateKey = string;
// Local wall-clock time as 24h `HH:mm`.
export type TimeKey = string;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toTimeKey(date: Date): TimeKey {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Local midnight for a date key, or null if the key is not a real date.
export function parseDateKey(key: string): Date | null {
  const match = DATE_RE.exec(key);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return valid ? date : null;
}

export function isValidDateKey(key: unknown): key is DateKey {
  return typeof key === "string" && parseDateKey(key) !== null;
}

export function isValidTimeKey(key: unknown): key is TimeKey {
  return typeof key === "string" && TIME_RE.test(key);
}

export function parseTimeKey(key: TimeKey): { hours: number; minutes: number } {
  const match = TIME_RE.exec(key);
  return match
    ? { hours: Number(match[1]), minutes: Number(match[2]) }
    : { hours: 0, minutes: 0 };
}

export function addDays(key: DateKey, days: number): DateKey {
  const date = parseDateKey(key) ?? new Date();
  return toDateKey(
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + days),
  );
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// Adds calendar months, clamping the day to the end of the target month.
export function addMonthsClamped(
  key: DateKey,
  months: number,
  day?: number,
): DateKey {
  const date = parseDateKey(key) ?? new Date();
  const wantedDay = day ?? date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const clamped = Math.min(
    wantedDay,
    daysInMonth(target.getFullYear(), target.getMonth()),
  );
  return toDateKey(
    new Date(target.getFullYear(), target.getMonth(), clamped),
  );
}

// 0 = Sunday … 6 = Saturday.
export function weekdayOf(key: DateKey): number {
  return (parseDateKey(key) ?? new Date()).getDay();
}

// Monday of the week containing `key` (weeks start on Monday).
export function startOfWeek(key: DateKey): DateKey {
  const offset = (weekdayOf(key) + 6) % 7;
  return addDays(key, -offset);
}

export function endOfWeek(key: DateKey): DateKey {
  return addDays(startOfWeek(key), 6);
}

export function diffInDays(a: DateKey, b: DateKey): number {
  const da = parseDateKey(a) ?? new Date();
  const db = parseDateKey(b) ?? new Date();
  // Compare UTC midnights so DST shifts don't produce fractional days.
  return Math.round(
    (Date.UTC(da.getFullYear(), da.getMonth(), da.getDate()) -
      Date.UTC(db.getFullYear(), db.getMonth(), db.getDate())) /
      86_400_000,
  );
}

// Local date key for an ISO instant.
export function dateKeyOfInstant(iso: string): DateKey | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : toDateKey(date);
}

// Combines a date key and optional time into a local Date (end of day if no time).
export function toLocalDateTime(
  dueDate: DateKey,
  dueTime: TimeKey | null,
): Date | null {
  const day = parseDateKey(dueDate);
  if (!day) return null;
  if (!dueTime) {
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
  }
  const { hours, minutes } = parseTimeKey(dueTime);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
}

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
export const WEEKDAY_LABELS = WEEKDAYS_SHORT;

// "5 PM" or "5:30 PM". Deterministic, independent of device locale.
export function formatTime(time: TimeKey): string {
  const { hours, minutes } = parseTimeKey(time);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return minutes === 0
    ? `${hour12} ${suffix}`
    : `${hour12}:${pad(minutes)} ${suffix}`;
}

// "Mon, Sep 22" (adds the year when it isn't the current one).
export function formatDay(key: DateKey, today: DateKey): string {
  const date = parseDateKey(key);
  if (!date) return key;
  const base = `${WEEKDAYS_SHORT[date.getDay()]}, ${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
  return date.getFullYear() === Number(today.slice(0, 4))
    ? base
    : `${base}, ${date.getFullYear()}`;
}

// "Today", "Tomorrow", "Yesterday", or a short date.
export function formatDayRelative(key: DateKey, today: DateKey): string {
  const delta = diffInDays(key, today);
  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta === -1) return "Yesterday";
  return formatDay(key, today);
}

export function formatDueLabel(
  dueDate: DateKey | null,
  dueTime: TimeKey | null,
  today: DateKey,
): string | null {
  if (!dueDate) return null;
  const day = formatDayRelative(dueDate, today);
  return dueTime ? `${day} ${formatTime(dueTime)}` : day;
}

// mm:ss for the focus timer.
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export type Clock = { today: DateKey; time: string };

export function clockAt(now: Date): Clock {
  return { today: toDateKey(now), time: toTimeKey(now) };
}

export const toIsoString = (date: Date): string => date.toISOString();
