import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import type { AppData } from "@/features/backup/backup";

import {
  focusSessionFromRow,
  focusSessionToRow,
  projectFromRow,
  projectToRow,
  tagFromRow,
  tagToRow,
  taskFromRow,
  taskToRow,
  type FocusSessionRow,
  type ProjectRow,
  type TagRow,
  type TaskRow,
} from "./row-mappers";

// What lives in the cloud: everything the user creates. Settings are
// per-device (theme, notification defaults) and are never uploaded.
export type CloudData = Omit<AppData, "settings">;

// Unvalidated records read back from the cloud; `normalizeAppData` cleans them.
export type RawCloudData = { [K in keyof CloudData]: Record<string, unknown>[] };

export interface CloudStore {
  // Reads everything currently stored in the cloud.
  fetch(): Promise<RawCloudData>;
  // Makes the cloud match `data` exactly: upserts everything, removes the rest.
  replace(data: CloudData): Promise<void>;
}

export class CloudSyncError extends Error {
  constructor(operation: string, cause: PostgrestError) {
    super(`Supabase ${operation} failed: ${cause.message}${cause.code ? ` (${cause.code})` : ""}`);
    this.name = "CloudSyncError";
  }
}

// PostgREST caps a response at the project's `max-rows` (1,000 by default), so
// reads are paged. Writes are chunked to keep request bodies and URLs small.
const PAGE_SIZE = 1000;
const WRITE_CHUNK = 500;
const DELETE_CHUNK = 100;

// Prefixed so they can share a Supabase project with other apps, including the
// earlier version of this one, which had its own `tasks` table.
export const TABLES = {
  projects: "tm_projects",
  tags: "tm_tags",
  tasks: "tm_tasks",
  focusSessions: "tm_focus_sessions",
} as const;

const COLUMNS = {
  tasks:
    "id, title, description, completed, completed_at, priority, due_date, due_time, project_id, tag_ids, subtasks, reminder, recurrence, created_at, updated_at",
  projects: "id, name, color, archived, created_at, updated_at",
  tags: "id, name, created_at, updated_at",
  focusSessions:
    "id, task_id, duration_ms, status, started_at, ends_at, remaining_ms, finished_at, acknowledged",
} as const;

type Table = keyof typeof COLUMNS;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

export class SupabaseCloudStore implements CloudStore {
  constructor(private readonly client: SupabaseClient) {}

  async fetch(): Promise<RawCloudData> {
    const [projects, tags, tasks, focusSessions] = await Promise.all([
      this.readPages<ProjectRow>("projects", COLUMNS.projects),
      this.readPages<TagRow>("tags", COLUMNS.tags),
      this.readPages<TaskRow>("tasks", COLUMNS.tasks),
      this.readPages<FocusSessionRow>("focusSessions", COLUMNS.focusSessions),
    ]);
    return {
      tasks: tasks.map(taskFromRow),
      projects: projects.map(projectFromRow),
      tags: tags.map(tagFromRow),
      focusSessions: focusSessions.map(focusSessionFromRow),
    };
  }

  // Upserts are idempotent, so a failed run can simply be retried. Parents are
  // written before children so the foreign keys in supabase/schema.sql hold at
  // every step; stale rows are removed children-first.
  async replace(data: CloudData): Promise<void> {
    const projects = data.projects.map(projectToRow);
    const tags = data.tags.map(tagToRow);
    const projectIds = new Set(projects.map((row) => row.id));
    const tasks = data.tasks.map((task) => {
      const row = taskToRow(task);
      // Local data never dangles, but one bad link must not fail the upload.
      return row.project_id !== null && !projectIds.has(row.project_id)
        ? { ...row, project_id: null }
        : row;
    });
    const taskIds = new Set(tasks.map((row) => row.id));
    const sessions = data.focusSessions
      .map(focusSessionToRow)
      .filter((row) => taskIds.has(row.task_id));

    await this.upsert("projects", projects);
    await this.upsert("tags", tags);
    await this.upsert("tasks", tasks);
    await this.upsert("focusSessions", sessions);

    await this.deleteMissing("focusSessions", sessions);
    await this.deleteMissing("tasks", tasks);
    await this.deleteMissing("projects", projects);
    await this.deleteMissing("tags", tags);
  }

  private async readPages<Row>(table: Table, columns: string): Promise<Row[]> {
    const rows: Row[] = [];
    // Stops on an empty page rather than a short one: a server-side max-rows
    // below PAGE_SIZE would otherwise end the loop early and drop records.
    for (;;) {
      const { data, error } = await this.client
        .from(TABLES[table])
        .select(columns)
        .order("id", { ascending: true })
        .range(rows.length, rows.length + PAGE_SIZE - 1)
        .returns<Row[]>();
      if (error) throw new CloudSyncError(`read ${TABLES[table]}`, error);
      if (!data || data.length === 0) return rows;
      rows.push(...data);
    }
  }

  private async upsert(table: Table, rows: readonly { id: string }[]): Promise<void> {
    for (const part of chunk(rows, WRITE_CHUNK)) {
      const { error } = await this.client.from(TABLES[table]).upsert(part, { onConflict: "id" });
      if (error) throw new CloudSyncError(`write ${TABLES[table]}`, error);
    }
  }

  private async deleteMissing(table: Table, keep: readonly { id: string }[]): Promise<void> {
    const keepIds = new Set(keep.map((row) => row.id));
    const remote = await this.readPages<{ id: string }>(table, "id");
    const stale = remote.map((row) => row.id).filter((id) => !keepIds.has(id));
    for (const ids of chunk(stale, DELETE_CHUNK)) {
      const { error } = await this.client.from(TABLES[table]).delete().in("id", ids);
      if (error) throw new CloudSyncError(`delete ${TABLES[table]}`, error);
    }
  }
}
