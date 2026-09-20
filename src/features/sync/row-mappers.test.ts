import { describe, expect, it } from "@jest/globals";

import { coerceFocusSession } from "@/features/focus/schemas";
import { coerceProject } from "@/features/projects/schemas";
import { coerceTag } from "@/features/tags/schemas";
import { coerceTask } from "@/features/tasks/schemas";
import { makeProject, makeTag, makeTask } from "@/testing/factories";

import {
  focusSessionFromRow,
  focusSessionToRow,
  projectFromRow,
  projectToRow,
  tagFromRow,
  tagToRow,
  taskFromRow,
  taskToRow,
} from "./row-mappers";

describe("row mappers", () => {
  it("round-trips a fully populated task", () => {
    const task = makeTask({
      description: "details",
      completed: true,
      completedAt: "2026-02-01T10:00:00.000Z",
      priority: "low",
      dueDate: "2026-03-04",
      dueTime: "08:15",
      projectId: "p1",
      tagIds: ["a", "b"],
      subtasks: [{ id: "s", title: "x", completed: false }],
      reminder: { kind: "custom", at: "2026-03-04T07:00:00.000Z" },
      recurrence: { kind: "custom", interval: 2, unit: "week" },
    });
    expect(coerceTask(taskFromRow(taskToRow(task)))).toEqual(task);
  });

  it("round-trips projects, tags and focus sessions", () => {
    const project = makeProject({ color: "rose", archived: true });
    const tag = makeTag();
    const session = {
      id: "f",
      taskId: "t",
      durationMs: 60_000,
      status: "paused" as const,
      startedAt: "2026-01-01T00:00:00.000Z",
      endsAt: null,
      remainingMs: 30_000,
      finishedAt: null,
      acknowledged: false,
    };
    expect(coerceProject(projectFromRow(projectToRow(project)))).toEqual(project);
    expect(coerceTag(tagFromRow(tagToRow(tag)))).toEqual(tag);
    expect(coerceFocusSession(focusSessionFromRow(focusSessionToRow(session)))).toEqual(session);
  });

  it("normalises Postgres timestamptz strings back to the app's ISO format", () => {
    const row = taskToRow(makeTask());
    const restored = coerceTask(
      taskFromRow({ ...row, created_at: "2026-01-01T00:00:00+00:00", updated_at: "2026-01-01T05:30:00.123456+00:00" }),
    );
    expect(restored?.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(restored?.updatedAt).toBe("2026-01-01T05:30:00.123Z");
  });

  it("marks a session with no `acknowledged` flag as answered", () => {
    const row = focusSessionToRow({
      id: "f",
      taskId: "t",
      durationMs: 1,
      status: "stopped",
      startedAt: "2026-01-01T00:00:00.000Z",
      endsAt: null,
      remainingMs: null,
      finishedAt: null,
    });
    expect(row.acknowledged).toBe(true);
  });

  it("lets the schemas repair or reject bad rows instead of crashing", () => {
    const row = taskToRow(makeTask());
    expect(coerceTask(taskFromRow({ ...row, priority: "urgent!!" }))?.priority).toBe("medium");
    expect(coerceTask(taskFromRow({ ...row, title: "   " }))).toBeNull();
    expect(coerceTask(taskFromRow({ ...row, subtasks: "not an array", tag_ids: null as never }))).toMatchObject({
      subtasks: [],
      tagIds: [],
    });
  });
});
