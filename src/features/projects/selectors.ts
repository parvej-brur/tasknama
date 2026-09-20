import { createSelector } from "@reduxjs/toolkit";

import { selectAllTasks } from "@/features/tasks/selectors";
import type { RootState } from "@/lib/store/create-store";

import { archivedProjectIds } from "./project-utils";

export const selectProjectMap = (state: RootState) => state.projects.byId;

export const selectAllProjects = createSelector([selectProjectMap], (byId) =>
  Object.values(byId).sort((a, b) => a.name.localeCompare(b.name)),
);

export const selectActiveProjects = createSelector([selectAllProjects], (projects) =>
  projects.filter((p) => !p.archived),
);

export const selectArchivedProjects = createSelector([selectAllProjects], (projects) =>
  projects.filter((p) => p.archived),
);

export const selectArchivedIds = createSelector([selectAllProjects], (projects) =>
  archivedProjectIds(projects),
);

// Done and total tasks per project, computed in one pass.
export const selectProjectProgress = createSelector([selectAllTasks], (tasks) => {
  const progress: Record<string, { done: number; total: number }> = {};
  for (const task of tasks) {
    if (!task.projectId) continue;
    const entry = (progress[task.projectId] ??= { done: 0, total: 0 });
    entry.total += 1;
    if (task.completed) entry.done += 1;
  }
  return progress;
});
