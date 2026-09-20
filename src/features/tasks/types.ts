// Domain model for tasks. Everything here is plain JSON so it can be stored in
// MMKV and exported as-is.
import type { Reminder } from "@/features/notifications/types";
import type { DateKey, TimeKey } from "@/utils/date";

export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const DEFAULT_PRIORITY: Priority = "medium";

export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type RecurrenceUnit = "day" | "week" | "month";

export type Recurrence =
  | { kind: "daily" }
  // 0 = Sunday … 6 = Saturday. Never empty.
  | { kind: "weekly"; weekdays: number[] }
  | { kind: "monthly"; dayOfMonth: number }
  | { kind: "custom"; interval: number; unit: RecurrenceUnit };

export type Task = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
  priority: Priority;
  dueDate: DateKey | null;
  dueTime: TimeKey | null;
  projectId: string | null;
  tagIds: string[];
  subtasks: Subtask[];
  reminder: Reminder | null;
  recurrence: Recurrence | null;
  createdAt: string;
  updatedAt: string;
};

// Fields the user can edit on a task.
export type TaskInput = {
  title: string;
  description: string;
  priority: Priority;
  dueDate: DateKey | null;
  dueTime: TimeKey | null;
  projectId: string | null;
  tagIds: string[];
  subtasks: Subtask[];
  reminder: Reminder | null;
  recurrence: Recurrence | null;
};

export const EMPTY_TASK_INPUT: TaskInput = {
  title: "",
  description: "",
  priority: DEFAULT_PRIORITY,
  dueDate: null,
  dueTime: null,
  projectId: null,
  tagIds: [],
  subtasks: [],
  reminder: null,
  recurrence: null,
};
