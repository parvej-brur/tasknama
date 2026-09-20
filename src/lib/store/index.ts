import { useSyncExternalStore } from "react";

import { dataImported } from "@/features/backup/actions";
import type { AppData } from "@/features/backup/backup";
import { DEFAULT_SETTINGS } from "@/features/settings/types";
import { createMMKVBackend } from "@/lib/storage/mmkv-backend";

import { createAppStore } from "./create-store";
import { attachPersistence, loadState } from "./persistence";

export type { AppDispatch, AppStore, AppThunk, RootState } from "./create-store";

export type StorageStatus = "ready" | "loading" | "error";

let status: StorageStatus = "ready";
const listeners = new Set<() => void>();
function setStatus(next: StorageStatus) {
  status = next;
  listeners.forEach((listener) => listener());
}

function openStorage() {
  try {
    const backend = createMMKVBackend();
    return { backend, loaded: loadState(backend) };
  } catch {
    return null;
  }
}

// MMKV is synchronous, so a healthy store starts fully hydrated on the first
// render. If storage can't be opened the app still starts, with an error state
// on the lists and a Retry button, instead of crashing.
const opened = openStorage();

export const store = createAppStore(opened?.loaded.state);

// Records that couldn't be read at startup; the root layout tells the user.
export let hydrationSkipped = opened?.loaded.skipped ?? 0;

if (opened) attachPersistence(store, opened.backend);
else status = "error";

function toAppData(state: ReturnType<typeof loadState>["state"]): AppData {
  return {
    tasks: Object.values(state.tasks?.byId ?? {}),
    projects: Object.values(state.projects?.byId ?? {}),
    tags: Object.values(state.tags?.byId ?? {}),
    focusSessions: Object.values(state.focus?.sessionsById ?? {}),
    settings: state.settings ?? DEFAULT_SETTINGS,
  };
}

// Tries to open storage again after a failure (the lists' Retry button).
export function retryStorage(): void {
  setStatus("loading");
  const retry = openStorage();
  if (!retry) return setStatus("error");
  hydrationSkipped = retry.loaded.skipped;
  // Load first, then start persisting, so the import isn't written straight back.
  store.dispatch(dataImported(toAppData(retry.loaded.state)));
  attachPersistence(store, retry.backend);
  setStatus("ready");
}

export function useStorageStatus(): StorageStatus {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => status,
    () => status,
  );
}
