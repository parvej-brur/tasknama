import { coerceFocusSession } from "@/features/focus/schemas";
import type { FocusSession } from "@/features/focus/types";
import { coerceProject } from "@/features/projects/schemas";
import type { Project } from "@/features/projects/types";
import { coerceSettings } from "@/features/settings/schemas";
import type { Settings } from "@/features/settings/types";
import { coerceTag } from "@/features/tags/schemas";
import type { Tag } from "@/features/tags/types";
import { coerceTask } from "@/features/tasks/schemas";
import type { Task } from "@/features/tasks/types";
import { dateKeyOfInstant, toTimeKey } from "@/utils/date";

export const APP_ID = "tasknama";
export const CURRENT_SCHEMA_VERSION = 2;

export type AppData = {
  tasks: Task[];
  projects: Project[];
  tags: Tag[];
  focusSessions: FocusSession[];
  settings: Settings;
};

export type BackupFile = AppData & {
  app: typeof APP_ID;
  schemaVersion: number;
  exportedAt: string;
};

export function buildBackup(data: AppData, now: Date = new Date()): BackupFile {
  return {
    app: APP_ID,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    ...data,
  };
}

export type ImportSummary = {
  tasks: number;
  projects: number;
  tags: number;
  focusSessions: number;
  // Records that were unreadable or duplicated and left out.
  skipped: number;
  fromVersion: number;
};

export type ParsedBackup =
  | { ok: true; data: AppData; summary: ImportSummary }
  | { ok: false; error: string };

type Raw = Record<string, unknown>;
const isRecord = (v: unknown): v is Raw =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// ---------------------------------------------------------------------------
// Migrations. Each step upgrades a raw file from version N to N + 1.
// ---------------------------------------------------------------------------

const slug = (name: string) =>
  name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x";

// v1 files stored tasks with `done`, `notes`, a numeric priority (1 = high),
// a single `due` ISO instant, and project / label *names* instead of ids.
function migrateV1toV2(file: Raw): Raw {
  const tasks = Array.isArray(file.tasks) ? file.tasks : [];
  const projects = new Map<string, Raw>();
  const tags = new Map<string, Raw>();
  const nowIso = new Date().toISOString();

  const migrated = tasks.map((entry): unknown => {
    if (!isRecord(entry)) return entry;
    const due = typeof entry.due === "string" ? new Date(entry.due) : null;
    const validDue = due && !Number.isNaN(due.getTime()) ? due : null;
    const created =
      typeof entry.created === "string" ? entry.created : nowIso;

    let projectId: string | null = null;
    if (typeof entry.project === "string" && entry.project.trim()) {
      projectId = `p-${slug(entry.project)}`;
      if (!projects.has(projectId)) {
        projects.set(projectId, { id: projectId, name: entry.project, createdAt: created });
      }
    }

    const tagIds: string[] = [];
    if (Array.isArray(entry.labels)) {
      for (const label of entry.labels) {
        if (typeof label !== "string" || !label.trim()) continue;
        const id = `t-${slug(label)}`;
        if (!tags.has(id)) tags.set(id, { id, name: label, createdAt: created });
        tagIds.push(id);
      }
    }

    const priorityByNumber = ["high", "medium", "low"];
    return {
      id: entry.id,
      title: entry.title,
      description: entry.notes,
      completed: entry.done === true,
      completedAt: entry.done === true ? entry.completedAt ?? created : null,
      priority:
        typeof entry.priority === "number"
          ? priorityByNumber[entry.priority - 1]
          : entry.priority,
      dueDate: validDue ? dateKeyOfInstant(validDue.toISOString()) : null,
      // Midnight means the old app stored a date with no time.
      dueTime:
        validDue && (validDue.getHours() !== 0 || validDue.getMinutes() !== 0)
          ? toTimeKey(validDue)
          : null,
      projectId,
      tagIds,
      createdAt: created,
      updatedAt: created,
    };
  });

  return {
    ...file,
    schemaVersion: 2,
    tasks: migrated,
    projects: [...projects.values()],
    tags: [...tags.values()],
  };
}

const MIGRATIONS: Record<number, (file: Raw) => Raw> = {
  1: migrateV1toV2,
};

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function readList<T>(
  raw: unknown,
  coerce: (item: unknown) => T | null,
): { items: T[]; skipped: number } {
  if (raw === undefined) return { items: [], skipped: 0 };
  if (!Array.isArray(raw)) return { items: [], skipped: 1 };
  const items: T[] = [];
  let skipped = 0;
  for (const entry of raw) {
    const value = coerce(entry);
    if (value) items.push(value);
    else skipped += 1;
  }
  return { items, skipped };
}

// Keeps the first record for each id / case-insensitive name.
function dedupeNamed<T extends { id: string; name: string }>(
  items: T[],
): { items: T[]; remap: Map<string, string>; skipped: number } {
  const byName = new Map<string, T>();
  const ids = new Set<string>();
  const remap = new Map<string, string>();
  let skipped = 0;
  for (const item of items) {
    const key = item.name.trim().toLowerCase();
    const kept = byName.get(key);
    if (ids.has(item.id) || kept) {
      skipped += 1;
      if (kept && kept.id !== item.id) remap.set(item.id, kept.id);
      continue;
    }
    byName.set(key, item);
    ids.add(item.id);
  }
  return { items: [...byName.values()], remap, skipped };
}

// Turns untrusted `tasks` / `projects` / `tags` / `focusSessions` / `settings`
// lists into consistent app data: unreadable records are skipped, duplicates are
// merged and dangling links are dropped. Shared by file import and cloud restore.
export function normalizeAppData(file: Raw): { data: AppData; skipped: number } {
  const projectsRead = readList<Project>(file.projects, coerceProject);
  const tagsRead = readList<Tag>(file.tags, coerceTag);
  const tasksRead = readList<Task>(file.tasks, coerceTask);
  const sessionsRead = readList<FocusSession>(file.focusSessions, coerceFocusSession);

  const projects = dedupeNamed(projectsRead.items);
  const tags = dedupeNamed(tagsRead.items);
  const projectIds = new Set(projects.items.map((p) => p.id));
  const tagIds = new Set(tags.items.map((t) => t.id));

  // Keep referential integrity: point at merged duplicates, drop dangling links.
  const seenTaskIds = new Set<string>();
  const tasks: Task[] = [];
  let duplicateTasks = 0;
  for (const task of tasksRead.items) {
    if (seenTaskIds.has(task.id)) {
      duplicateTasks += 1;
      continue;
    }
    seenTaskIds.add(task.id);
    const projectId =
      task.projectId === null ? null : (projects.remap.get(task.projectId) ?? task.projectId);
    tasks.push({
      ...task,
      projectId: projectId !== null && projectIds.has(projectId) ? projectId : null,
      tagIds: Array.from(
        new Set(
          task.tagIds
            .map((id) => tags.remap.get(id) ?? id)
            .filter((id) => tagIds.has(id)),
        ),
      ),
    });
  }

  // A backup can't restore a running timer against a deleted task.
  const focusSessions = sessionsRead.items
    .filter((s) => seenTaskIds.has(s.taskId))
    .map((s): FocusSession =>
      s.status === "running" || s.status === "paused"
        ? { ...s, status: "stopped", endsAt: null, remainingMs: null, finishedAt: s.startedAt, acknowledged: true }
        : { ...s, acknowledged: true },
    );

  const skipped =
    projectsRead.skipped +
    tagsRead.skipped +
    tasksRead.skipped +
    sessionsRead.skipped +
    projects.skipped +
    tags.skipped +
    duplicateTasks +
    (sessionsRead.items.length - focusSessions.length);

  return {
    data: {
      tasks,
      projects: projects.items,
      tags: tags.items,
      focusSessions,
      settings: coerceSettings(file.settings),
    },
    skipped,
  };
}

// Validates and upgrades an exported file. Unreadable records are counted and
// skipped; a file that isn't ours, or is from a newer app, is rejected whole.
export function parseBackup(text: string): ParsedBackup {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file isn't valid JSON." };
  }
  if (!isRecord(json)) {
    return { ok: false, error: "This file doesn't look like a TaskNama backup." };
  }

  const version = typeof json.schemaVersion === "number"
    ? json.schemaVersion
    : typeof json.version === "number"
      ? json.version
      : null;
  if (version === null || !Number.isInteger(version) || version < 1) {
    return { ok: false, error: "This file doesn't look like a TaskNama backup." };
  }
  if (version > CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: "This backup was made by a newer version of the app. Update the app and try again.",
    };
  }

  let file: Raw = json;
  for (let v = version; v < CURRENT_SCHEMA_VERSION; v += 1) {
    file = MIGRATIONS[v](file);
  }

  if (!Array.isArray(file.tasks) && !Array.isArray(file.projects) && !Array.isArray(file.tags)) {
    return { ok: false, error: "This backup doesn't contain any tasks, projects or tags." };
  }

  const { data, skipped } = normalizeAppData(file);
  return {
    ok: true,
    data,
    summary: {
      tasks: data.tasks.length,
      projects: data.projects.length,
      tags: data.tags.length,
      focusSessions: data.focusSessions.length,
      skipped,
      fromVersion: version,
    },
  };
}
