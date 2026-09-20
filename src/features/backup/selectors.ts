import { createSelector } from "@reduxjs/toolkit";

import { selectAllSessions } from "@/features/focus/selectors";
import { selectAllProjects } from "@/features/projects/selectors";
import { selectSettings } from "@/features/settings/selectors";
import { selectAllTags } from "@/features/tags/selectors";
import { selectAllTasks } from "@/features/tasks/selectors";

import type { AppData } from "./backup";

// Everything the user owns, in the shape that is exported and re-imported.
export const selectAppData = createSelector(
  [selectAllTasks, selectAllProjects, selectAllTags, selectAllSessions, selectSettings],
  (tasks, projects, tags, focusSessions, settings): AppData => ({
    tasks,
    projects,
    tags,
    focusSessions,
    settings,
  }),
);
