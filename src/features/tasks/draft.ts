import { isValidDateKey, isValidTimeKey } from "@/utils/date";

import { coerceRecurrence } from "./schemas";
import { PRIORITIES, type TaskInput } from "./types";

// Reads a task draft passed between screens as a JSON route param (quick add's
// "Open full form"). Anything malformed is ignored rather than trusted.
export function parseDraftParam(raw: unknown): Partial<TaskInput> {
  if (typeof raw !== "string") return {};
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const v = value as Record<string, unknown>;

  const draft: Partial<TaskInput> = {};
  if (typeof v.title === "string") draft.title = v.title;
  if (typeof v.description === "string") draft.description = v.description;
  if ((PRIORITIES as readonly unknown[]).includes(v.priority)) draft.priority = v.priority as TaskInput["priority"];
  if (isValidDateKey(v.dueDate)) {
    draft.dueDate = v.dueDate;
    if (isValidTimeKey(v.dueTime)) draft.dueTime = v.dueTime;
    const recurrence = coerceRecurrence(v.recurrence);
    if (recurrence) draft.recurrence = recurrence;
  }
  if (typeof v.projectId === "string") draft.projectId = v.projectId;
  if (Array.isArray(v.tagIds)) draft.tagIds = v.tagIds.filter((id): id is string => typeof id === "string");
  return draft;
}
