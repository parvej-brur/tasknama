import type { FocusSession } from "@/features/focus/types";
import type { Project } from "@/features/projects/types";
import type { Tag } from "@/features/tags/types";
import type { Task } from "@/features/tasks/types";
import { isIso } from "@/utils/validation";

// Column names match supabase/schema.sql. Rows read from the database are
// untrusted, so the `*FromRow` mappers return loose objects that the feature
// schemas (`coerceTask` and friends) validate afterwards.

export type TaskRow = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completed_at: string | null;
  priority: string;
  due_date: string | null;
  due_time: string | null;
  project_id: string | null;
  tag_ids: string[];
  subtasks: unknown;
  reminder: unknown;
  recurrence: unknown;
  created_at: string;
  updated_at: string;
};

export type ProjectRow = {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type TagRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type FocusSessionRow = {
  id: string;
  task_id: string;
  duration_ms: number;
  status: string;
  started_at: string;
  ends_at: number | null;
  remaining_ms: number | null;
  finished_at: string | null;
  acknowledged: boolean;
};

// timestamptz comes back as "2026-01-01T00:00:00+00:00"; the app stores
// "2026-01-01T00:00:00.000Z". Normalising keeps a restore identical to what was
// uploaded.
function toIso(value: unknown): string | null {
  return isIso(value) ? new Date(value).toISOString() : null;
}

export function taskToRow(task: Task): TaskRow {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.completed,
    completed_at: task.completedAt,
    priority: task.priority,
    due_date: task.dueDate,
    due_time: task.dueTime,
    project_id: task.projectId,
    tag_ids: task.tagIds,
    subtasks: task.subtasks,
    reminder: task.reminder,
    recurrence: task.recurrence,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  };
}

export function taskFromRow(row: TaskRow): Record<string, unknown> {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: row.completed,
    completedAt: toIso(row.completed_at),
    priority: row.priority,
    dueDate: row.due_date,
    dueTime: row.due_time,
    projectId: row.project_id,
    tagIds: row.tag_ids,
    subtasks: row.subtasks,
    reminder: row.reminder,
    recurrence: row.recurrence,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function projectToRow(project: Project): ProjectRow {
  return {
    id: project.id,
    name: project.name,
    color: project.color,
    archived: project.archived,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}

export function projectFromRow(row: ProjectRow): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    archived: row.archived,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function tagToRow(tag: Tag): TagRow {
  return {
    id: tag.id,
    name: tag.name,
    created_at: tag.createdAt,
    updated_at: tag.updatedAt,
  };
}

export function tagFromRow(row: TagRow): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function focusSessionToRow(session: FocusSession): FocusSessionRow {
  return {
    id: session.id,
    task_id: session.taskId,
    duration_ms: session.durationMs,
    status: session.status,
    started_at: session.startedAt,
    ends_at: session.endsAt,
    remaining_ms: session.remainingMs,
    finished_at: session.finishedAt,
    // Missing on older records, which counts as answered.
    acknowledged: session.acknowledged ?? true,
  };
}

export function focusSessionFromRow(row: FocusSessionRow): Record<string, unknown> {
  return {
    id: row.id,
    taskId: row.task_id,
    durationMs: row.duration_ms,
    status: row.status,
    startedAt: toIso(row.started_at),
    endsAt: row.ends_at,
    remainingMs: row.remaining_ms,
    finishedAt: toIso(row.finished_at),
    acknowledged: row.acknowledged,
  };
}
