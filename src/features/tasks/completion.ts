import type { Reminder } from "@/features/notifications/types";
import { diffInDays, type DateKey } from "@/utils/date";

import { nextDueDate } from "./recurrence";
import type { Task } from "./types";

// Builds the follow-up task created when a recurring task is completed:
// the next due date, subtasks reset, and project / tags / priority / reminder
// copied. Returns null when the task doesn't repeat or has no due date.
export function buildNextOccurrence(
  task: Task,
  today: DateKey,
  newId: string,
  nowIso: string,
): Task | null {
  if (!task.recurrence || !task.dueDate) return null;
  const dueDate = nextDueDate(task.recurrence, task.dueDate, today);
  return {
    ...task,
    id: newId,
    completed: false,
    completedAt: null,
    dueDate,
    subtasks: task.subtasks.map((s) => ({ ...s, completed: false })),
    reminder: shiftReminder(task.reminder, task.dueDate, dueDate),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

// Presets follow the new due date on their own; custom times shift with it.
function shiftReminder(
  reminder: Reminder | null,
  from: DateKey,
  to: DateKey,
): Reminder | null {
  if (!reminder || reminder.kind === "preset") return reminder;
  const shifted = new Date(reminder.at);
  if (Number.isNaN(shifted.getTime())) return null;
  shifted.setDate(shifted.getDate() + diffInDays(to, from));
  return { kind: "custom", at: shifted.toISOString() };
}
