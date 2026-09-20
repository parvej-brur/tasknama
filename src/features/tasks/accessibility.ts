import { formatDueLabel, type DateKey } from "@/utils/date";

import { subtaskProgress } from "./task-views";
import type { Task } from "./types";

// "Today 5 PM" reads better aloud as "today 5 PM".
function speakable(label: string): string {
  return /^(Today|Tomorrow|Yesterday)/.test(label)
    ? label.charAt(0).toLowerCase() + label.slice(1)
    : label;
}

// The spoken description of a task row, e.g.
// "Buy milk, high priority, due today 5 PM, not completed".
export function taskA11yLabel(task: Task, today: DateKey, overdue: boolean): string {
  const parts = [task.title, `${task.priority} priority`];
  const due = formatDueLabel(task.dueDate, task.dueTime, today);
  if (due) parts.push(`due ${speakable(due)}`);
  parts.push(task.completed ? "completed" : "not completed");
  if (overdue) parts.push("overdue");
  const { done, total } = subtaskProgress(task);
  if (total > 0) parts.push(`${done} of ${total} subtasks done`);
  return parts.join(", ");
}
