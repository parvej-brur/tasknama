import { LIMITS } from "@/config/limits";
import { coerceReminder } from "@/features/notifications/schemas";
import { isValidDateKey, isValidTimeKey } from "@/utils/date";
import { asString, isIso, isRecord } from "@/utils/validation";

import { validateRecurrence } from "./recurrence";
import {
  PRIORITIES,
  type Priority,
  type Recurrence,
  type Subtask,
  type Task,
  type TaskInput,
} from "./types";

export type TaskField =
  | "title"
  | "description"
  | "dueDate"
  | "dueTime"
  | "project"
  | "tags"
  | "recurrence"
  | "reminder";

export type TaskErrors = Partial<Record<TaskField, string>>;

export type ValidationContext = {
  projectIds: ReadonlySet<string>;
  tagIds: ReadonlySet<string>;
};

export function validateTaskInput(
  input: TaskInput,
  context: ValidationContext,
): TaskErrors {
  const errors: TaskErrors = {};
  const title = input.title.trim();

  if (!title) errors.title = "Title is required.";
  else if (title.length > LIMITS.titleMax) {
    errors.title = `Title must be ${LIMITS.titleMax} characters or fewer.`;
  }

  if (input.description.length > LIMITS.descriptionMax) {
    errors.description = `Description must be ${LIMITS.descriptionMax} characters or fewer.`;
  }

  if (input.dueDate !== null && !isValidDateKey(input.dueDate)) {
    errors.dueDate = "Enter a valid date.";
  }

  if (input.dueTime !== null) {
    if (input.dueDate === null) errors.dueTime = "A time needs a date.";
    else if (!isValidTimeKey(input.dueTime)) errors.dueTime = "Enter a valid time.";
  }

  if (input.recurrence) {
    if (input.dueDate === null) errors.recurrence = "Repeating needs a date.";
    else {
      const problem = validateRecurrence(input.recurrence);
      if (problem) errors.recurrence = problem;
    }
  }

  if (input.reminder) {
    if (input.reminder.kind === "preset" && input.dueDate === null) {
      errors.reminder = "This reminder needs a due date. Pick a date or use a custom time.";
    } else if (
      input.reminder.kind === "custom" &&
      Number.isNaN(new Date(input.reminder.at).getTime())
    ) {
      errors.reminder = "Enter a valid reminder time.";
    }
  }

  if (input.projectId !== null && !context.projectIds.has(input.projectId)) {
    errors.project = "That project no longer exists.";
  }

  if (input.tagIds.some((id) => !context.tagIds.has(id))) {
    errors.tags = "One of the selected tags no longer exists.";
  }

  return errors;
}

// Trims and normalizes user input before it is stored.
export function normalizeTaskInput(input: TaskInput): TaskInput {
  const dueDate = input.dueDate;
  return {
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    dueTime: dueDate ? input.dueTime : null,
    recurrence: dueDate ? input.recurrence : null,
    tagIds: Array.from(new Set(input.tagIds)),
    subtasks: input.subtasks
      .map((s) => ({ ...s, title: s.title.trim() }))
      .filter((s) => s.title.length > 0),
  };
}

// ---------------------------------------------------------------------------
// Coercion from untrusted data (storage, imports). Anything that cannot be
// repaired returns null so the caller can skip the record instead of crashing.
// ---------------------------------------------------------------------------

export function coerceRecurrence(raw: unknown): Recurrence | null {
  if (!isRecord(raw)) return null;
  let rule: Recurrence | null = null;
  switch (raw.kind) {
    case "daily":
      rule = { kind: "daily" };
      break;
    case "weekly":
      if (Array.isArray(raw.weekdays)) {
        rule = {
          kind: "weekly",
          weekdays: Array.from(new Set(raw.weekdays.filter((d): d is number => typeof d === "number"))),
        };
      }
      break;
    case "monthly":
      if (typeof raw.dayOfMonth === "number") {
        rule = { kind: "monthly", dayOfMonth: raw.dayOfMonth };
      }
      break;
    case "custom":
      if (typeof raw.interval === "number" && typeof raw.unit === "string") {
        rule = {
          kind: "custom",
          interval: raw.interval,
          unit: raw.unit as "day" | "week" | "month",
        };
      }
      break;
  }
  return rule && validateRecurrence(rule) === null ? rule : null;
}

function coerceSubtasks(raw: unknown): Subtask[] {
  if (!Array.isArray(raw)) return [];
  const result: Subtask[] = [];
  for (const item of raw) {
    if (!isRecord(item) || typeof item.id !== "string") continue;
    const title = asString(item.title).trim();
    if (!title) continue;
    result.push({ id: item.id, title, completed: item.completed === true });
  }
  return result;
}

// A stored or imported task, repaired where possible; null if unusable.
export function coerceTask(raw: unknown): Task | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || raw.id.length === 0) return null;
  const title = asString(raw.title).trim();
  if (!title) return null;

  const dueDate = isValidDateKey(raw.dueDate) ? raw.dueDate : null;
  const now = new Date().toISOString();
  const createdAt = isIso(raw.createdAt) ? raw.createdAt : now;
  const completed = raw.completed === true;

  return {
    id: raw.id,
    title: title.slice(0, LIMITS.titleMax),
    description: asString(raw.description).slice(0, LIMITS.descriptionMax),
    completed,
    completedAt: completed
      ? isIso(raw.completedAt)
        ? raw.completedAt
        : isIso(raw.updatedAt)
          ? raw.updatedAt
          : createdAt
      : null,
    priority: (PRIORITIES as readonly unknown[]).includes(raw.priority)
      ? (raw.priority as Priority)
      : "medium",
    dueDate,
    dueTime: dueDate && isValidTimeKey(raw.dueTime) ? raw.dueTime : null,
    projectId: typeof raw.projectId === "string" ? raw.projectId : null,
    tagIds: Array.isArray(raw.tagIds)
      ? Array.from(new Set(raw.tagIds.filter((t): t is string => typeof t === "string")))
      : [],
    subtasks: coerceSubtasks(raw.subtasks),
    reminder: coerceReminder(raw.reminder),
    recurrence: dueDate ? coerceRecurrence(raw.recurrence) : null,
    createdAt,
    updatedAt: isIso(raw.updatedAt) ? raw.updatedAt : createdAt,
  };
}
