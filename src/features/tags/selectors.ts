import { createSelector } from "@reduxjs/toolkit";

import { selectAllTasks } from "@/features/tasks/selectors";
import type { RootState } from "@/lib/store/create-store";

export const selectTagMap = (state: RootState) => state.tags.byId;

export const selectAllTags = createSelector([selectTagMap], (byId) =>
  Object.values(byId).sort((a, b) => a.name.localeCompare(b.name)),
);

// How many tasks carry each tag.
export const selectTagCounts = createSelector([selectAllTasks], (tasks) => {
  const counts: Record<string, number> = {};
  for (const task of tasks) for (const id of task.tagIds) counts[id] = (counts[id] ?? 0) + 1;
  return counts;
});
