type Listener = (message: string) => void;

const listeners = new Set<Listener>();
let lastReportAt = 0;

// Storage failures are surfaced to the UI (a snackbar) instead of crashing.
export function subscribeStorageErrors(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function reportStorageError(error: unknown, action: "save" | "load" = "save"): void {
  if (__DEV__) console.warn("[storage]", error);
  // A failing disk fails on every record; tell the user once, not per record.
  const now = Date.now();
  if (now - lastReportAt < 5000) return;
  lastReportAt = now;
  const message =
    action === "save"
      ? "Couldn't save your changes. Your device storage may be full."
      : "Some saved data couldn't be read and was skipped.";
  listeners.forEach((listener) => listener(message));
}
