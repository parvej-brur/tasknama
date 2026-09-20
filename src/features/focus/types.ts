export type FocusStatus = "running" | "paused" | "completed" | "stopped";

export type FocusSession = {
  id: string;
  taskId: string;
  durationMs: number;
  status: FocusStatus;
  startedAt: string;
  // Epoch ms the session ends at. Only set while running.
  endsAt: number | null;
  // Time left, frozen while paused.
  remainingMs: number | null;
  finishedAt: string | null;
  // False from the moment a session completes until the user has answered the
  // "complete the task or start another" prompt, so the prompt survives an app
  // kill. Missing on older records, which counts as answered.
  acknowledged?: boolean;
};
