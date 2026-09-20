import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "@/lib/store/create-store";

import { isLive } from "./session";
import type { FocusSession } from "./types";

export const selectSessionMap = (state: RootState) => state.focus.sessionsById;

export const selectAllSessions = createSelector([selectSessionMap], (byId) =>
  Object.values(byId),
);

// The running or paused focus session, if any.
export const selectLiveSession = createSelector(
  [selectAllSessions],
  (sessions): FocusSession | null => sessions.find(isLive) ?? null,
);

// A finished session the user hasn't answered the end-of-session prompt for.
export const selectPendingCompletion = createSelector(
  [selectAllSessions],
  (sessions): FocusSession | null =>
    sessions
      .filter((s) => s.status === "completed" && s.acknowledged === false)
      .sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""))[0] ?? null,
);
