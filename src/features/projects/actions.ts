import { nanoid } from "@reduxjs/toolkit";

import type { AppThunk } from "@/lib/store/create-store";
import { toIsoString } from "@/utils/date";
import { validateName, type NameSaveResult } from "@/utils/validation";

import { projectAdded, projectArchivedChanged, projectDeleted, projectUpdated } from "./store";
import type { ProjectColorId } from "./types";

export function createProject(
  name: string,
  color: ProjectColorId,
  options: { id?: string; now?: Date } = {},
): AppThunk<NameSaveResult> {
  return (dispatch, getState) => {
    const existing = Object.values(getState().projects.byId);
    const error = validateName(name, existing);
    if (error) return { ok: false, error };
    const now = toIsoString(options.now ?? new Date());
    const id = options.id ?? nanoid();
    dispatch(
      projectAdded({
        id,
        name: name.trim(),
        color,
        archived: false,
        createdAt: now,
        updatedAt: now,
      }),
    );
    return { ok: true, id };
  };
}

export function editProject(
  id: string,
  changes: { name: string; color: ProjectColorId },
  now: Date = new Date(),
): AppThunk<NameSaveResult> {
  return (dispatch, getState) => {
    const existing = Object.values(getState().projects.byId);
    const error = validateName(changes.name, existing, id);
    if (error) return { ok: false, error };
    dispatch(
      projectUpdated({
        id,
        changes: { name: changes.name.trim(), color: changes.color },
        at: toIsoString(now),
      }),
    );
    return { ok: true, id };
  };
}

export const setProjectArchived = (id: string, archived: boolean, now: Date = new Date()) =>
  projectArchivedChanged({ id, archived, at: toIsoString(now) });

// Deleting a project moves its tasks to Inbox (handled by the tasks slice).
export const deleteProject = (id: string, now: Date = new Date()) =>
  projectDeleted(id, toIsoString(now));
