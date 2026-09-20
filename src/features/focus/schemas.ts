import { isIso, isRecord } from "@/utils/validation";

import type { FocusSession } from "./types";

export function coerceFocusSession(raw: unknown): FocusSession | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || typeof raw.taskId !== "string") return null;
  if (typeof raw.durationMs !== "number" || raw.durationMs <= 0) return null;
  const status = raw.status;
  if (
    status !== "running" &&
    status !== "paused" &&
    status !== "completed" &&
    status !== "stopped"
  ) {
    return null;
  }
  if (!isIso(raw.startedAt)) return null;
  if (status === "running" && typeof raw.endsAt !== "number") return null;
  if (status === "paused" && typeof raw.remainingMs !== "number") return null;
  return {
    id: raw.id,
    taskId: raw.taskId,
    durationMs: raw.durationMs,
    status,
    startedAt: raw.startedAt,
    endsAt: typeof raw.endsAt === "number" ? raw.endsAt : null,
    remainingMs: typeof raw.remainingMs === "number" ? raw.remainingMs : null,
    finishedAt: isIso(raw.finishedAt) ? raw.finishedAt : null,
    acknowledged: typeof raw.acknowledged === "boolean" ? raw.acknowledged : true,
  };
}
