import { nanoid } from "@reduxjs/toolkit";

import type { AppThunk } from "@/lib/store/create-store";
import { toIsoString } from "@/utils/date";
import { validateName, type NameSaveResult } from "@/utils/validation";

import { tagAdded, tagDeleted, tagRenamed } from "./store";

export function createTag(name: string, now: Date = new Date()): AppThunk<NameSaveResult> {
  return (dispatch, getState) => {
    const existing = Object.values(getState().tags.byId);
    const error = validateName(name, existing);
    if (error) return { ok: false, error };
    const at = toIsoString(now);
    const id = nanoid();
    dispatch(tagAdded({ id, name: name.trim(), createdAt: at, updatedAt: at }));
    return { ok: true, id };
  };
}

export function renameTag(id: string, name: string, now: Date = new Date()): AppThunk<NameSaveResult> {
  return (dispatch, getState) => {
    const error = validateName(name, Object.values(getState().tags.byId), id);
    if (error) return { ok: false, error };
    dispatch(tagRenamed({ id, name: name.trim(), at: toIsoString(now) }));
    return { ok: true, id };
  };
}

// Deleting a tag removes it from every task (handled by the tasks slice).
export const deleteTag = (id: string, now: Date = new Date()) => tagDeleted(id, toIsoString(now));
