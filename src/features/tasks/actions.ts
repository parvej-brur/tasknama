import { nanoid } from "@reduxjs/toolkit";

import { LIMITS } from "@/config/limits";
import { createTag } from "@/features/tags/actions";
import type { AppThunk, RootState } from "@/lib/store/create-store";
import { toDateKey, toIsoString } from "@/utils/date";
import { hasErrors } from "@/utils/validation";

import { buildNextOccurrence } from "./completion";
import type { QuickAddResult } from "./quick-add";
import {
  normalizeTaskInput,
  validateTaskInput,
  type TaskErrors,
  type ValidationContext,
} from "./schemas";
import {
  completionUndone,
  subtaskAdded,
  subtaskEdited,
  subtaskMoved,
  subtaskRemoved,
  subtaskToggled,
  taskAdded,
  taskCompleted,
  taskDeleted,
  taskReopened,
  taskRestored,
  taskUpdated,
} from "./store";
import type { Task, TaskInput } from "./types";

// Thunks own everything that needs the current state or the clock: validation,
// ids, timestamps and the recurring-task follow-up. Reducers stay pure.

export function validationContext(state: RootState): ValidationContext {
  return {
    projectIds: new Set(Object.keys(state.projects.byId)),
    tagIds: new Set(Object.keys(state.tags.byId)),
  };
}

export type TaskSaveResult =
  | { ok: true; id: string }
  | { ok: false; errors: TaskErrors };


export function createTask(
  input: TaskInput,
  options: { id?: string; now?: Date } = {},
): AppThunk<TaskSaveResult> {
  return (dispatch, getState) => {
    const now = options.now ?? new Date();
    const errors = validateTaskInput(input, validationContext(getState()));
    if (hasErrors(errors)) return { ok: false, errors };

    // The caller passes a stable id, so a second tap on Save re-uses it and
    // the reducer ignores the duplicate.
    const id = options.id ?? nanoid();
    const clean = normalizeTaskInput(input);
    const task: Task = {
      ...clean,
      id,
      completed: false,
      completedAt: null,
      createdAt: toIsoString(now),
      updatedAt: toIsoString(now),
    };
    dispatch(taskAdded(task));
    return { ok: true, id };
  };
}

export function updateTask(
  id: string,
  input: TaskInput,
  now: Date = new Date(),
): AppThunk<TaskSaveResult> {
  return (dispatch, getState) => {
    const state = getState();
    if (!state.tasks.byId[id]) {
      return { ok: false, errors: { title: "This task no longer exists." } };
    }
    const errors = validateTaskInput(input, validationContext(state));
    if (hasErrors(errors)) return { ok: false, errors };
    dispatch(taskUpdated({ id, changes: normalizeTaskInput(input), at: toIsoString(now) }));
    return { ok: true, id };
  };
}

// Creates a task from a parsed quick-add sentence, adding any new tags.
export function createTaskFromQuickAdd(
  parsed: QuickAddResult,
  options: { id?: string; now?: Date } = {},
): AppThunk<TaskSaveResult> {
  return (dispatch, getState) => {
    const title = parsed.title.trim();
    if (!title) return { ok: false, errors: { title: "Title is required." } };

    const tagIds: string[] = [];
    for (const tag of parsed.tags) {
      if (tag.existingId && getState().tags.byId[tag.existingId]) {
        tagIds.push(tag.existingId);
        continue;
      }
      const created = dispatch(createTag(tag.name, options.now));
      if (created.ok) tagIds.push(created.id);
    }

    return dispatch(
      createTask(
        {
          title,
          description: "",
          priority: parsed.priority ?? "medium",
          dueDate: parsed.dueDate,
          dueTime: parsed.dueTime,
          projectId: null,
          tagIds,
          subtasks: [],
          reminder: null,
          recurrence: parsed.recurrence,
        },
        options,
      ),
    );
  };
}

export type CompleteResult = { nextId: string | null };

export function completeTask(id: string, now: Date = new Date()): AppThunk<CompleteResult | null> {
  return (dispatch, getState) => {
    const task = getState().tasks.byId[id];
    if (!task || task.completed) return null;
    const next = buildNextOccurrence(task, toDateKey(now), nanoid(), toIsoString(now));
    dispatch(taskCompleted({ id, next, at: toIsoString(now) }));
    return { nextId: next?.id ?? null };
  };
}

export function reopenTask(id: string, now: Date = new Date()): AppThunk {
  return (dispatch) => {
    dispatch(taskReopened({ id, at: toIsoString(now) }));
  };
}

export function undoCompletion(
  id: string,
  nextId: string | null,
  now: Date = new Date(),
): AppThunk {
  return (dispatch) => {
    dispatch(completionUndone({ id, nextId, at: toIsoString(now) }));
  };
}

// Returns the deleted task so the caller can offer Undo.
export function deleteTask(id: string): AppThunk<Task | null> {
  return (dispatch, getState) => {
    const task = getState().tasks.byId[id];
    if (!task) return null;
    dispatch(taskDeleted(id));
    return task;
  };
}

export function restoreTask(task: Task): AppThunk {
  return (dispatch) => {
    dispatch(taskRestored(task));
  };
}

// --- Subtasks --------------------------------------------------------------

export function addSubtask(taskId: string, title: string, now: Date = new Date()): AppThunk<boolean> {
  return (dispatch, getState) => {
    const clean = title.trim().slice(0, LIMITS.subtaskTitleMax);
    if (!clean || !getState().tasks.byId[taskId]) return false;
    dispatch(
      subtaskAdded({
        taskId,
        subtask: { id: nanoid(), title: clean, completed: false },
        at: toIsoString(now),
      }),
    );
    return true;
  };
}

export function editSubtask(
  taskId: string,
  id: string,
  title: string,
  now: Date = new Date(),
): AppThunk<boolean> {
  return (dispatch) => {
    const clean = title.trim().slice(0, LIMITS.subtaskTitleMax);
    if (!clean) return false;
    dispatch(subtaskEdited({ taskId, id, title: clean, at: toIsoString(now) }));
    return true;
  };
}

export const toggleSubtask = (taskId: string, id: string, now: Date = new Date()) =>
  subtaskToggled({ taskId, id, at: toIsoString(now) });
export const removeSubtask = (taskId: string, id: string, now: Date = new Date()) =>
  subtaskRemoved({ taskId, id, at: toIsoString(now) });
export const moveSubtask = (
  taskId: string,
  id: string,
  direction: -1 | 1,
  now: Date = new Date(),
) => subtaskMoved({ taskId, id, direction, at: toIsoString(now) });
