import { endOfWeek, startOfWeek, type Clock } from "@/utils/date";

import { isOverdue, priorityRank } from "./task-views";
import type { Priority, Task } from "./types";

// ---------------------------------------------------------------------------
// Search, filter, sort — the three compose in a single pass.
// ---------------------------------------------------------------------------

export type StatusFilter = "all" | "active" | "completed";
export type DueFilter = "any" | "overdue" | "today" | "week" | "none";
export type SortKey = "dueDate" | "priority" | "createdAt" | "updatedAt";
export type SortDirection = "asc" | "desc";

export type TaskQuery = {
  search: string;
  status: StatusFilter;
  priority: Priority | null;
  projectId: string | null;
  tagId: string | null;
  due: DueFilter;
  sortKey: SortKey;
  sortDir: SortDirection;
};

export const DEFAULT_QUERY: TaskQuery = {
  search: "",
  status: "all",
  priority: null,
  projectId: null,
  tagId: null,
  due: "any",
  sortKey: "dueDate",
  sortDir: "asc",
};

// Number of filters (not search or sort) that differ from `baseline`, the
// screen's own defaults, so a screen that pins status to "active" isn't
// reported as having a filter on.
export function activeFilterCount(
  query: TaskQuery,
  baseline: TaskQuery = DEFAULT_QUERY,
): number {
  return [
    query.status !== baseline.status,
    query.priority !== baseline.priority,
    query.projectId !== baseline.projectId,
    query.tagId !== baseline.tagId,
    query.due !== baseline.due,
  ].filter(Boolean).length;
}

function matchesDue(task: Task, due: DueFilter, clock: Clock): boolean {
  switch (due) {
    case "any":
      return true;
    case "none":
      return task.dueDate === null;
    case "overdue":
      return isOverdue(task, clock);
    case "today":
      return task.dueDate === clock.today;
    case "week":
      return (
        task.dueDate !== null &&
        task.dueDate >= startOfWeek(clock.today) &&
        task.dueDate <= endOfWeek(clock.today)
      );
  }
}

export function compareTasks(key: SortKey, dir: SortDirection) {
  const sign = dir === "asc" ? 1 : -1;
  return (a: Task, b: Task): number => {
    let primary = 0;
    if (key === "dueDate") {
      // Undated tasks sink to the bottom in both directions.
      if (a.dueDate === null && b.dueDate === null) primary = 0;
      else if (a.dueDate === null) return 1;
      else if (b.dueDate === null) return -1;
      else {
        primary =
          a.dueDate.localeCompare(b.dueDate) ||
          (a.dueTime ?? "").localeCompare(b.dueTime ?? "");
      }
    } else if (key === "priority") {
      primary = priorityRank(a.priority) - priorityRank(b.priority);
    } else {
      primary = a[key].localeCompare(b[key]);
    }
    return (
      primary * sign ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id)
    );
  };
}

export function queryTasks(
  tasks: readonly Task[],
  query: TaskQuery,
  clock: Clock,
): Task[] {
  const needle = query.search.trim().toLowerCase();
  return tasks
    .filter((task) => {
      if (query.status === "active" && task.completed) return false;
      if (query.status === "completed" && !task.completed) return false;
      if (query.priority && task.priority !== query.priority) return false;
      if (query.projectId && task.projectId !== query.projectId) return false;
      if (query.tagId && !task.tagIds.includes(query.tagId)) return false;
      if (!matchesDue(task, query.due, clock)) return false;
      if (needle) {
        return (
          task.title.toLowerCase().includes(needle) ||
          task.description.toLowerCase().includes(needle)
        );
      }
      return true;
    })
    .sort(compareTasks(query.sortKey, query.sortDir));
}
