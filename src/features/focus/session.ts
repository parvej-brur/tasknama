import type { FocusSession } from "./types";

// A session that still occupies the timer: running or paused.
export const isLive = (s: FocusSession | null | undefined): s is FocusSession =>
  !!s && (s.status === "running" || s.status === "paused");

export function startSession(
  id: string,
  taskId: string,
  durationMs: number,
  now: number,
): FocusSession {
  return {
    id,
    taskId,
    durationMs,
    status: "running",
    startedAt: new Date(now).toISOString(),
    endsAt: now + durationMs,
    remainingMs: null,
    finishedAt: null,
    acknowledged: false,
  };
}

// Remaining time comes from the end timestamp, never from a ticking counter.
export function remainingMs(session: FocusSession, now: number): number {
  if (session.status === "running" && session.endsAt !== null) {
    return Math.max(0, session.endsAt - now);
  }
  if (session.status === "paused") return session.remainingMs ?? session.durationMs;
  return 0;
}

export function pauseSession(session: FocusSession, now: number): FocusSession {
  if (session.status !== "running") return session;
  return {
    ...session,
    status: "paused",
    remainingMs: remainingMs(session, now),
    endsAt: null,
  };
}

export function resumeSession(session: FocusSession, now: number): FocusSession {
  if (session.status !== "paused") return session;
  return {
    ...session,
    status: "running",
    endsAt: now + (session.remainingMs ?? session.durationMs),
    remainingMs: null,
  };
}

export function stopSession(session: FocusSession, now: number): FocusSession {
  if (!isLive(session)) return session;
  return {
    ...session,
    status: "stopped",
    endsAt: null,
    remainingMs: null,
    finishedAt: new Date(now).toISOString(),
  };
}

// If a running session's end time has passed (the app was closed or killed
// meanwhile), mark it completed as of the moment it actually ended.
export function reconcileSession(session: FocusSession, now: number): FocusSession {
  if (session.status !== "running" || session.endsAt === null) return session;
  if (now < session.endsAt) return session;
  return {
    ...session,
    status: "completed",
    finishedAt: new Date(session.endsAt).toISOString(),
    endsAt: null,
    remainingMs: 0,
  };
}
