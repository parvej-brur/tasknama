import type { Task } from "@/features/tasks/types";
import { formatDay, formatTime, toDateKey, toLocalDateTime } from "@/utils/date";

import type { ReminderPreset } from "./types";

// iOS keeps at most 64 pending local notifications; we use 50 for reminders.
export const MAX_SCHEDULED_REMINDERS = 50;

// Time used for "at due time" when a task has a date but no time.
export const DEFAULT_REMINDER_TIME = "09:00";

export const PRESET_LABELS: Record<ReminderPreset, string> = {
  atDue: "At due time",
  "10m": "10 minutes before",
  "1h": "1 hour before",
  "1d": "1 day before",
};

const PRESET_OFFSET_MS: Record<ReminderPreset, number> = {
  atDue: 0,
  "10m": 10 * 60_000,
  "1h": 60 * 60_000,
  "1d": 24 * 60 * 60_000,
};

// When a task's reminder should fire, or null if it has none / can't be computed.
export function reminderFireAt(task: Task): Date | null {
  const { reminder } = task;
  if (!reminder) return null;
  if (reminder.kind === "custom") {
    const at = new Date(reminder.at);
    return Number.isNaN(at.getTime()) ? null : at;
  }
  if (!task.dueDate) return null;
  const due = toLocalDateTime(task.dueDate, task.dueTime ?? DEFAULT_REMINDER_TIME);
  return due ? new Date(due.getTime() - PRESET_OFFSET_MS[reminder.preset]) : null;
}

export type PlannedReminder = {
  taskId: string;
  // Epoch ms.
  fireAt: number;
  title: string;
  body: string;
};

// The reminders that should be scheduled right now: active tasks whose
// reminder is still in the future, soonest first, capped to the OS limit.
export function planReminders(
  tasks: Iterable<Task>,
  now: number,
  limit: number = MAX_SCHEDULED_REMINDERS,
): PlannedReminder[] {
  const planned: PlannedReminder[] = [];
  const today = toDateKey(new Date(now));
  for (const task of tasks) {
    if (task.completed) continue;
    const fireAt = reminderFireAt(task);
    if (!fireAt || fireAt.getTime() <= now) continue;
    // Absolute wording: the notification may fire days after it is planned.
    const body = task.dueDate
      ? `Due ${formatDay(task.dueDate, today)}${task.dueTime ? ` ${formatTime(task.dueTime)}` : ""}`
      : "Reminder";
    planned.push({
      taskId: task.id,
      fireAt: fireAt.getTime(),
      title: task.title,
      body,
    });
  }
  planned.sort((a, b) => a.fireAt - b.fireAt || a.taskId.localeCompare(b.taskId));
  return planned.slice(0, limit);
}

export const reminderIdentifier = (taskId: string) => `reminder:${taskId}`;
export const isReminderIdentifier = (id: string) => id.startsWith("reminder:");

// What a reminder looks like once it is registered with the OS.
export type ScheduledReminder = {
  identifier: string;
  // Changes whenever the fire time or text changes.
  signature: string;
};

export const reminderSignature = (r: PlannedReminder) =>
  `${r.fireAt}|${r.title}|${r.body}`;

// Minimal set of OS calls needed to make the schedule match the plan.
export function diffReminders(
  planned: readonly PlannedReminder[],
  scheduled: readonly ScheduledReminder[],
): { cancel: string[]; schedule: PlannedReminder[] } {
  const wanted = new Map(planned.map((p) => [reminderIdentifier(p.taskId), p]));
  const have = new Map(scheduled.map((s) => [s.identifier, s.signature]));

  const cancel: string[] = [];
  for (const { identifier, signature } of scheduled) {
    const target = wanted.get(identifier);
    if (!target || reminderSignature(target) !== signature) cancel.push(identifier);
  }

  const schedule = planned.filter((p) => {
    const id = reminderIdentifier(p.taskId);
    const existing = have.get(id);
    return existing === undefined || existing !== reminderSignature(p);
  });
  return { cancel, schedule };
}
