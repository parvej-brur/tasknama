import { nanoid } from "@reduxjs/toolkit";

import { cancelFocusEnd, scheduleFocusEnd } from "@/features/notifications/notifications";
import type { AppThunk } from "@/lib/store/create-store";

import { selectLiveSession } from "./selectors";
import {
  pauseSession,
  reconcileSession,
  resumeSession,
  startSession,
  stopSession,
} from "./session";
import { focusSessionSaved } from "./store";
import type { FocusSession } from "./types";

// Timer state is only ever timestamps. The end notification is scheduled when a
// session starts or resumes and cancelled when it pauses or stops.

// Starts a session for a task; null if one is already running or paused.
export function startFocus(taskId: string, now: number = Date.now()): AppThunk<FocusSession | null> {
  return (dispatch, getState) => {
    const state = getState();
    const task = state.tasks.byId[taskId];
    if (!task || selectLiveSession(state)) return null;
    const session = startSession(nanoid(), taskId, state.settings.focusMinutes * 60_000, now);
    dispatch(focusSessionSaved(session));
    void scheduleFocusEnd(session.id, task.title, session.endsAt as number);
    return session;
  };
}

export function pauseFocus(now: number = Date.now()): AppThunk {
  return (dispatch, getState) => {
    const live = selectLiveSession(getState());
    if (!live) return;
    dispatch(focusSessionSaved(pauseSession(live, now)));
    void cancelFocusEnd(live.id);
  };
}

export function resumeFocus(now: number = Date.now()): AppThunk {
  return (dispatch, getState) => {
    const state = getState();
    const live = selectLiveSession(state);
    if (!live || live.status !== "paused") return;
    const resumed = resumeSession(live, now);
    dispatch(focusSessionSaved(resumed));
    void scheduleFocusEnd(
      resumed.id,
      state.tasks.byId[resumed.taskId]?.title ?? "Focus session",
      resumed.endsAt as number,
    );
  };
}

export function stopFocus(now: number = Date.now()): AppThunk {
  return (dispatch, getState) => {
    const live = selectLiveSession(getState());
    if (!live) return;
    dispatch(focusSessionSaved(stopSession(live, now)));
    void cancelFocusEnd(live.id);
  };
}

// Marks a running session completed once its end time has passed. Called at
// start, on foreground, and by the timer screen, so a session that ended while
// the app was closed is completed as soon as the app is opened again.
export function reconcileFocus(now: number = Date.now()): AppThunk<FocusSession | null> {
  return (dispatch, getState) => {
    const live = selectLiveSession(getState());
    if (!live) return null;
    const next = reconcileSession(live, now);
    if (next === live) return null;
    dispatch(focusSessionSaved(next));
    return next;
  };
}
