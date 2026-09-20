import type { FocusSession } from "@/features/focus/types";
import { isOverdue } from "@/features/tasks/task-views";
import type { Task } from "@/features/tasks/types";
import { dateKeyOfInstant, endOfWeek, startOfWeek, type Clock } from "@/utils/date";

export type Analytics = {
  completedToday: number;
  completedThisWeek: number;
  // Tasks due this week, and how many of them are completed.
  dueThisWeek: number;
  dueThisWeekCompleted: number;
  // 0–100, or null when nothing is due this week.
  completionRate: number | null;
  overdue: number;
  focusToday: number;
  focusThisWeek: number;
};

export function computeAnalytics(
  tasks: Iterable<Task>,
  sessions: Iterable<FocusSession>,
  clock: Clock,
): Analytics {
  const weekStart = startOfWeek(clock.today);
  const weekEnd = endOfWeek(clock.today);
  const inWeek = (key: string | null) => key !== null && key >= weekStart && key <= weekEnd;

  let completedToday = 0;
  let completedThisWeek = 0;
  let dueThisWeek = 0;
  let dueThisWeekCompleted = 0;
  let overdue = 0;

  for (const task of tasks) {
    if (task.completed && task.completedAt) {
      const day = dateKeyOfInstant(task.completedAt);
      if (day === clock.today) completedToday += 1;
      if (inWeek(day)) completedThisWeek += 1;
    }
    if (inWeek(task.dueDate)) {
      dueThisWeek += 1;
      if (task.completed) dueThisWeekCompleted += 1;
    }
    if (isOverdue(task, clock)) overdue += 1;
  }

  let focusToday = 0;
  let focusThisWeek = 0;
  for (const session of sessions) {
    if (session.status !== "completed" || !session.finishedAt) continue;
    const day = dateKeyOfInstant(session.finishedAt);
    if (day === clock.today) focusToday += 1;
    if (inWeek(day)) focusThisWeek += 1;
  }

  return {
    completedToday,
    completedThisWeek,
    dueThisWeek,
    dueThisWeekCompleted,
    completionRate:
      dueThisWeek === 0 ? null : Math.round((dueThisWeekCompleted / dueThisWeek) * 100),
    overdue,
    focusToday,
    focusThisWeek,
  };
}
