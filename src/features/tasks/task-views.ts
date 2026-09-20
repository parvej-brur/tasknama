import { dateKeyOfInstant, parseTimeKey, type Clock, type DateKey } from "@/utils/date";

import type { Priority, Task } from "./types";

const PRIORITY_RANK: Record<Priority, number> = { low: 0, medium: 1, high: 2 };

export function priorityRank(priority: Priority): number {
  return PRIORITY_RANK[priority];
}

// Active means not completed.
export const isActive = (task: Task): boolean => !task.completed;

// Overdue: the due date has passed, or today's due time has passed.
export function isOverdue(task: Task, clock: Clock): boolean {
  if (task.completed || !task.dueDate) return false;
  if (task.dueDate < clock.today) return true;
  if (task.dueDate > clock.today || !task.dueTime) return false;
  const due = parseTimeKey(task.dueTime);
  const now = parseTimeKey(clock.time);
  return due.hours * 60 + due.minutes < now.hours * 60 + now.minutes;
}

// Tasks in an archived project are hidden from the main views.
function visible(task: Task, archived: ReadonlySet<string>): boolean {
  return task.projectId === null || !archived.has(task.projectId);
}

function byDueThenPriority(a: Task, b: Task): number {
  return (
    (a.dueDate ?? "").localeCompare(b.dueDate ?? "") ||
    (a.dueTime ?? "").localeCompare(b.dueTime ?? "") ||
    PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
    a.createdAt.localeCompare(b.createdAt) ||
    a.id.localeCompare(b.id)
  );
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

// Inbox: active tasks with no project.
export function selectInbox(tasks: readonly Task[]): Task[] {
  return tasks.filter((t) => isActive(t) && t.projectId === null);
}

export type TodaySections = {
  overdue: Task[];
  today: Task[];
  // Active high priority tasks not already shown above.
  highPriority: Task[];
  progress: { done: number; total: number };
};

// Today view and dashboard. Overdue first, then due today.
export function selectToday(
  tasks: readonly Task[],
  clock: Clock,
  archived: ReadonlySet<string> = new Set(),
): TodaySections {
  const overdue: Task[] = [];
  const today: Task[] = [];
  const highPriority: Task[] = [];
  let done = 0;
  let total = 0;

  for (const task of tasks) {
    if (!visible(task, archived)) continue;
    if (task.dueDate === clock.today) {
      total += 1;
      if (task.completed) done += 1;
    }
    if (task.completed) continue;

    if (isOverdue(task, clock)) overdue.push(task);
    else if (task.dueDate === clock.today) today.push(task);
    else if (task.priority === "high") highPriority.push(task);
  }

  overdue.sort(byDueThenPriority);
  today.sort(byDueThenPriority);
  highPriority.sort(byDueThenPriority);
  return { overdue, today, highPriority, progress: { done, total } };
}

export type TaskGroup = { key: string; tasks: Task[] };

// Upcoming: active tasks due after today, grouped by date (soonest first).
export function selectUpcoming(
  tasks: readonly Task[],
  today: DateKey,
  archived: ReadonlySet<string> = new Set(),
): TaskGroup[] {
  const upcoming = tasks
    .filter(
      (t) => isActive(t) && t.dueDate !== null && t.dueDate > today && visible(t, archived),
    )
    .sort(byDueThenPriority);
  return groupBy(upcoming, (t) => t.dueDate as string);
}

// Groups an already-ordered list by due date (undated tasks last).
export function groupByDueDate(tasks: readonly Task[]): TaskGroup[] {
  const dated = tasks.filter((t) => t.dueDate !== null);
  const undated = tasks.filter((t) => t.dueDate === null);
  const groups = groupBy(dated, (t) => t.dueDate as string);
  if (undated.length > 0) groups.push({ key: "none", tasks: undated });
  return groups;
}

// Completed: newest first, grouped by the day they were completed.
export function selectCompleted(tasks: readonly Task[]): TaskGroup[] {
  const done = tasks
    .filter((t) => t.completed)
    .sort(
      (a, b) =>
        (b.completedAt ?? "").localeCompare(a.completedAt ?? "") ||
        a.id.localeCompare(b.id),
    );
  return groupBy(done, (t) => (t.completedAt && dateKeyOfInstant(t.completedAt)) || "unknown");
}

function groupBy(tasks: Task[], keyOf: (task: Task) => string): TaskGroup[] {
  const groups: TaskGroup[] = [];
  let current: TaskGroup | null = null;
  for (const task of tasks) {
    const key = keyOf(task);
    if (!current || current.key !== key) {
      current = { key, tasks: [] };
      groups.push(current);
    }
    current.tasks.push(task);
  }
  return groups;
}

export function subtaskProgress(task: Task): { done: number; total: number } {
  return {
    done: task.subtasks.filter((s) => s.completed).length,
    total: task.subtasks.length,
  };
}
