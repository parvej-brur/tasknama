import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "@/lib/store/create-store";

// Selectors depend on one slice's `byId` each, so unrelated changes (a theme
// switch, a focus tick) never recompute the task lists.

export const selectTaskMap = (state: RootState) => state.tasks.byId;

export const selectAllTasks = createSelector([selectTaskMap], (byId) => Object.values(byId));
