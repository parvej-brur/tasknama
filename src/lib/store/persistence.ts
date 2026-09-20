import { coerceFocusSession } from "@/features/focus/schemas";
import { reconcileSession } from "@/features/focus/session";
import { coerceProject } from "@/features/projects/schemas";
import { coerceSettings } from "@/features/settings/schemas";
import { coerceTag } from "@/features/tags/schemas";
import { coerceTask } from "@/features/tasks/schemas";
import { reportStorageError } from "@/lib/storage/errors";
import type { KeyValueBackend } from "@/lib/storage/key-value-backend";

import type { RootState } from "./create-store";

// One key per record, so a change rewrites only what changed.
const PREFIX = { task: "task:", project: "project:", tag: "tag:", focus: "focus:" } as const;
const SETTINGS_KEY = "settings";

function readRecords<T>(
  backend: KeyValueBackend,
  prefix: string,
  coerce: (raw: unknown) => T | null,
  idOf: (item: T) => string,
): { byId: Record<string, T>; skipped: number } {
  const byId: Record<string, T> = {};
  let skipped = 0;
  for (const key of backend.keys()) {
    if (!key.startsWith(prefix)) continue;
    try {
      const raw = backend.get(key);
      const item = raw === undefined ? null : coerce(JSON.parse(raw));
      // A record filed under the wrong key is treated as corrupt.
      if (item && key === prefix + idOf(item)) byId[idOf(item)] = item;
      else skipped += 1;
    } catch {
      skipped += 1;
    }
  }
  return { byId, skipped };
}

// Loads everything from storage. Corrupt records are skipped, never fatal.
// A focus session whose end time passed while the app was closed is marked
// completed here, so reopening the app shows the right state immediately.
export function loadState(
  backend: KeyValueBackend,
  now: number = Date.now(),
): { state: Partial<RootState>; skipped: number } {
  let skipped = 0;
  const tasks = readRecords(backend, PREFIX.task, coerceTask, (t) => t.id);
  const projects = readRecords(backend, PREFIX.project, coerceProject, (p) => p.id);
  const tags = readRecords(backend, PREFIX.tag, coerceTag, (t) => t.id);
  const focus = readRecords(backend, PREFIX.focus, coerceFocusSession, (s) => s.id);
  skipped += tasks.skipped + projects.skipped + tags.skipped + focus.skipped;

  for (const id of Object.keys(focus.byId)) {
    focus.byId[id] = reconcileSession(focus.byId[id], now);
  }

  let settings = coerceSettings(undefined);
  try {
    const raw = backend.get(SETTINGS_KEY);
    if (raw !== undefined) settings = coerceSettings(JSON.parse(raw));
  } catch {
    skipped += 1;
  }

  return {
    state: {
      tasks: { byId: tasks.byId },
      projects: { byId: projects.byId },
      tags: { byId: tags.byId },
      focus: { sessionsById: focus.byId },
      settings,
    },
    skipped,
  };
}

function syncRecords<T>(
  backend: KeyValueBackend,
  prefix: string,
  previous: Record<string, T>,
  current: Record<string, T>,
): void {
  if (previous === current) return;
  // Immer keeps untouched records referentially equal, so this writes only
  // records that were added or changed, and removes deleted ones.
  for (const id in current) {
    if (current[id] === previous[id]) continue;
    try {
      backend.set(prefix + id, JSON.stringify(current[id]));
    } catch (error) {
      reportStorageError(error, "save");
    }
  }
  for (const id in previous) {
    if (id in current) continue;
    try {
      backend.remove(prefix + id);
    } catch (error) {
      reportStorageError(error, "save");
    }
  }
}

type Subscribable = {
  getState: () => RootState;
  subscribe: (listener: () => void) => () => void;
};

// Writes changed records to storage after every state change.
export function attachPersistence(store: Subscribable, backend: KeyValueBackend): () => void {
  let previous = store.getState();
  return store.subscribe(() => {
    const current = store.getState();
    syncRecords(backend, PREFIX.task, previous.tasks.byId, current.tasks.byId);
    syncRecords(backend, PREFIX.project, previous.projects.byId, current.projects.byId);
    syncRecords(backend, PREFIX.tag, previous.tags.byId, current.tags.byId);
    syncRecords(backend, PREFIX.focus, previous.focus.sessionsById, current.focus.sessionsById);
    if (current.settings !== previous.settings) {
      try {
        backend.set(SETTINGS_KEY, JSON.stringify(current.settings));
      } catch (error) {
        reportStorageError(error, "save");
      }
    }
    previous = current;
  });
}
