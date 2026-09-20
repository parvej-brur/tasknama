import type { Project } from "@/features/projects/types";
import type { Tag } from "@/features/tags/types";
import type { Task } from "@/features/tasks/types";

let counter = 0;

export function makeTask(overrides: Partial<Task> = {}): Task {
  counter += 1;
  return {
    id: `t${counter}`,
    title: `Task ${counter}`,
    description: "",
    completed: false,
    completedAt: null,
    priority: "medium",
    dueDate: null,
    dueTime: null,
    projectId: null,
    tagIds: [],
    subtasks: [],
    reminder: null,
    recurrence: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeProject(overrides: Partial<Project> = {}): Project {
  counter += 1;
  return {
    id: `p${counter}`,
    name: `Project ${counter}`,
    color: "teal",
    archived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeTag(overrides: Partial<Tag> = {}): Tag {
  counter += 1;
  return {
    id: `g${counter}`,
    name: `tag${counter}`,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
