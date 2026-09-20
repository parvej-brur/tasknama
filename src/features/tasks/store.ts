import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { dataImported } from "@/features/backup/actions";
import { projectDeleted } from "@/features/projects/store";
import { tagDeleted } from "@/features/tags/store";

import type { Subtask, Task, TaskInput } from "./types";

export type TasksState = { byId: Record<string, Task> };

export const initialTasksState: TasksState = { byId: {} };

type Stamped = { at: string };

function touch(task: Task | undefined, at: string): Task | undefined {
  if (task) task.updatedAt = at;
  return task;
}

const tasksSlice = createSlice({
  name: "tasks",
  initialState: initialTasksState,
  reducers: {
    // A repeated add with the same id is ignored, which is what makes a
    // double submit harmless.
    taskAdded(state, action: PayloadAction<Task>) {
      if (!state.byId[action.payload.id]) state.byId[action.payload.id] = action.payload;
    },
    taskUpdated(state, action: PayloadAction<{ id: string; changes: TaskInput } & Stamped>) {
      const task = touch(state.byId[action.payload.id], action.payload.at);
      if (task) Object.assign(task, action.payload.changes);
    },
    // Completes a task and, for recurring tasks, adds the next occurrence.
    taskCompleted(
      state,
      action: PayloadAction<{ id: string; next: Task | null } & Stamped>,
    ) {
      const { id, next, at } = action.payload;
      const task = state.byId[id];
      if (!task || task.completed) return;
      task.completed = true;
      task.completedAt = at;
      task.updatedAt = at;
      if (next && !state.byId[next.id]) state.byId[next.id] = next;
    },
    taskReopened(state, action: PayloadAction<{ id: string } & Stamped>) {
      const task = state.byId[action.payload.id];
      if (!task || !task.completed) return;
      task.completed = false;
      task.completedAt = null;
      task.updatedAt = action.payload.at;
    },
    // Reverses a completion, including the occurrence it created.
    completionUndone(
      state,
      action: PayloadAction<{ id: string; nextId: string | null } & Stamped>,
    ) {
      const { id, nextId, at } = action.payload;
      const task = state.byId[id];
      if (task?.completed) {
        task.completed = false;
        task.completedAt = null;
        task.updatedAt = at;
      }
      if (nextId) delete state.byId[nextId];
    },
    taskDeleted(state, action: PayloadAction<string>) {
      delete state.byId[action.payload];
    },
    // Undo of a delete: puts back the exact record, same id and data.
    taskRestored(state, action: PayloadAction<Task>) {
      if (!state.byId[action.payload.id]) state.byId[action.payload.id] = action.payload;
    },

    // Dev seed: many tasks in one action, so persistence diffs run once.
    tasksBulkAdded(state, action: PayloadAction<Task[]>) {
      for (const task of action.payload) {
        if (!state.byId[task.id]) state.byId[task.id] = task;
      }
    },
    tasksBulkRemoved(state, action: PayloadAction<string[]>) {
      for (const id of action.payload) delete state.byId[id];
    },

    subtaskAdded(state, action: PayloadAction<{ taskId: string; subtask: Subtask } & Stamped>) {
      const task = touch(state.byId[action.payload.taskId], action.payload.at);
      task?.subtasks.push(action.payload.subtask);
    },
    subtaskEdited(
      state,
      action: PayloadAction<{ taskId: string; id: string; title: string } & Stamped>,
    ) {
      const task = state.byId[action.payload.taskId];
      const subtask = task?.subtasks.find((s) => s.id === action.payload.id);
      if (!task || !subtask) return;
      subtask.title = action.payload.title;
      task.updatedAt = action.payload.at;
    },
    // Completing every subtask deliberately does not complete the parent.
    subtaskToggled(state, action: PayloadAction<{ taskId: string; id: string } & Stamped>) {
      const task = state.byId[action.payload.taskId];
      const subtask = task?.subtasks.find((s) => s.id === action.payload.id);
      if (!task || !subtask) return;
      subtask.completed = !subtask.completed;
      task.updatedAt = action.payload.at;
    },
    subtaskRemoved(state, action: PayloadAction<{ taskId: string; id: string } & Stamped>) {
      const task = touch(state.byId[action.payload.taskId], action.payload.at);
      if (task) task.subtasks = task.subtasks.filter((s) => s.id !== action.payload.id);
    },
    // Reorder by moving one step; there is no drag and drop.
    subtaskMoved(
      state,
      action: PayloadAction<{ taskId: string; id: string; direction: -1 | 1 } & Stamped>,
    ) {
      const task = state.byId[action.payload.taskId];
      if (!task) return;
      const from = task.subtasks.findIndex((s) => s.id === action.payload.id);
      const to = from + action.payload.direction;
      if (from < 0 || to < 0 || to >= task.subtasks.length) return;
      const [moved] = task.subtasks.splice(from, 1);
      task.subtasks.splice(to, 0, moved);
      task.updatedAt = action.payload.at;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(dataImported, (state, action) => {
        state.byId = Object.fromEntries(action.payload.tasks.map((t) => [t.id, t]));
      })
      // Deleting a project moves its tasks to Inbox.
      .addCase(projectDeleted, (state, action) => {
        for (const task of Object.values(state.byId)) {
          if (task.projectId === action.payload.id) {
            task.projectId = null;
            task.updatedAt = action.payload.at;
          }
        }
      })
      // Deleting a tag removes it from every task.
      .addCase(tagDeleted, (state, action) => {
        for (const task of Object.values(state.byId)) {
          if (task.tagIds.includes(action.payload.id)) {
            task.tagIds = task.tagIds.filter((id) => id !== action.payload.id);
            task.updatedAt = action.payload.at;
          }
        }
      });
  },
});

export const {
  taskAdded,
  taskUpdated,
  taskCompleted,
  taskReopened,
  completionUndone,
  taskDeleted,
  taskRestored,
  tasksBulkAdded,
  tasksBulkRemoved,
  subtaskAdded,
  subtaskEdited,
  subtaskToggled,
  subtaskRemoved,
  subtaskMoved,
} = tasksSlice.actions;
export default tasksSlice.reducer;
