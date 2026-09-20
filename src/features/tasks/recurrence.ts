import {
  addDays,
  addMonthsClamped,
  diffInDays,
  WEEKDAY_LABELS,
  weekdayOf,
  type DateKey,
} from "@/utils/date";

import type { Recurrence } from "./types";

// Hard stop for the catch-up loop so corrupt data can never hang the app.
const MAX_STEPS = 5000;

// The first occurrence strictly after `after`.
export function occurrenceAfter(rule: Recurrence, after: DateKey): DateKey {
  switch (rule.kind) {
    case "daily":
      return addDays(after, 1);
    case "weekly": {
      const days = new Set(rule.weekdays);
      const start = weekdayOf(after);
      for (let step = 1; step <= 7; step += 1) {
        if (days.has((start + step) % 7)) return addDays(after, step);
      }
      return addDays(after, 7);
    }
    case "monthly":
      return addMonthsClamped(after, 1, rule.dayOfMonth);
    case "custom":
      if (rule.unit === "day") return addDays(after, rule.interval);
      if (rule.unit === "week") return addDays(after, rule.interval * 7);
      return addMonthsClamped(after, rule.interval);
  }
}

// The due date for the task created when a recurring task is completed.
// Always after the current due date, and never in the past: completing an
// overdue task rolls forward to today or later while keeping the cadence.
export function nextDueDate(
  rule: Recurrence,
  currentDue: DateKey,
  today: DateKey,
): DateKey {
  let next = occurrenceAfter(rule, currentDue);
  // Skip ahead cheaply for long-overdue daily tasks.
  if (rule.kind === "daily" && diffInDays(today, next) > 1) next = today;
  let steps = 0;
  while (next < today && steps < MAX_STEPS) {
    next = occurrenceAfter(rule, next);
    steps += 1;
  }
  return next;
}

export function describeRecurrence(rule: Recurrence): string {
  switch (rule.kind) {
    case "daily":
      return "Every day";
    case "weekly": {
      const days = [...rule.weekdays].sort((a, b) => a - b);
      return days.length === 7
        ? "Every day"
        : `Every ${days.map((d) => WEEKDAY_LABELS[d]).join(", ")}`;
    }
    case "monthly":
      return `Monthly on day ${rule.dayOfMonth}`;
    case "custom": {
      const unit = `${rule.unit}${rule.interval === 1 ? "" : "s"}`;
      return rule.interval === 1 ? `Every ${rule.unit}` : `Every ${rule.interval} ${unit}`;
    }
  }
}

// Returns an error message, or null when the rule is well formed.
export function validateRecurrence(rule: Recurrence): string | null {
  switch (rule.kind) {
    case "daily":
      return null;
    case "weekly":
      if (rule.weekdays.length === 0) return "Pick at least one weekday.";
      return rule.weekdays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
        ? null
        : "Weekdays are invalid.";
    case "monthly":
      return Number.isInteger(rule.dayOfMonth) &&
        rule.dayOfMonth >= 1 &&
        rule.dayOfMonth <= 31
        ? null
        : "Day of month must be between 1 and 31.";
    case "custom":
      if (!["day", "week", "month"].includes(rule.unit)) {
        return "Repeat unit is invalid.";
      }
      return Number.isInteger(rule.interval) &&
        rule.interval >= 1 &&
        rule.interval <= 365
        ? null
        : "Repeat interval must be between 1 and 365.";
  }
}
