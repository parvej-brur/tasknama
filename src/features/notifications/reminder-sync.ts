import { AppState } from "react-native";

import type { AppStore } from "@/lib/store/create-store";

import { reconcileReminders } from "./notifications";

const DEBOUNCE_MS = 400;

// Keeps scheduled reminders in step with the task list: once at start, when
// the app returns to the foreground, and (debounced) after task changes.
// Returns a function that stops listening.
export function startReminderSync(store: AppStore): () => void {
  const run = () => reconcileReminders(Object.values(store.getState().tasks.byId));

  run();

  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastTasks = store.getState().tasks.byId;
  const unsubscribe = store.subscribe(() => {
    const tasks = store.getState().tasks.byId;
    if (tasks === lastTasks) return;
    lastTasks = tasks;
    clearTimeout(timer);
    timer = setTimeout(run, DEBOUNCE_MS);
  });

  const appState = AppState.addEventListener("change", (state) => {
    if (state === "active") run();
  });

  return () => {
    clearTimeout(timer);
    unsubscribe();
    appState.remove();
  };
}
