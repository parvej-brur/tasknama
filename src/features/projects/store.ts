import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { dataImported } from "@/features/backup/actions";

import type { Project, ProjectColorId } from "./types";

export type ProjectsState = { byId: Record<string, Project> };

export const initialProjectsState: ProjectsState = { byId: {} };

const projectsSlice = createSlice({
  name: "projects",
  initialState: initialProjectsState,
  reducers: {
    projectAdded(state, action: PayloadAction<Project>) {
      if (!state.byId[action.payload.id]) state.byId[action.payload.id] = action.payload;
    },
    projectUpdated(
      state,
      action: PayloadAction<{
        id: string;
        changes: { name?: string; color?: ProjectColorId };
        at: string;
      }>,
    ) {
      const project = state.byId[action.payload.id];
      if (!project) return;
      Object.assign(project, action.payload.changes, { updatedAt: action.payload.at });
    },
    projectArchivedChanged(
      state,
      action: PayloadAction<{ id: string; archived: boolean; at: string }>,
    ) {
      const project = state.byId[action.payload.id];
      if (!project || project.archived === action.payload.archived) return;
      project.archived = action.payload.archived;
      project.updatedAt = action.payload.at;
    },
    // Tasks are moved to Inbox by the tasks slice, which listens for this too.
    projectDeleted: {
      reducer(state, action: PayloadAction<{ id: string; at: string }>) {
        delete state.byId[action.payload.id];
      },
      prepare(id: string, at: string = new Date().toISOString()) {
        return { payload: { id, at } };
      },
    },
  },
  extraReducers: (builder) => {
    builder.addCase(dataImported, (state, action) => {
      state.byId = Object.fromEntries(action.payload.projects.map((p) => [p.id, p]));
    });
  },
});

export const { projectAdded, projectUpdated, projectArchivedChanged, projectDeleted } =
  projectsSlice.actions;
export default projectsSlice.reducer;
