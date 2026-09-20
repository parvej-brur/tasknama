import { describe, expect, it } from "@jest/globals";

import { DEFAULT_SETTINGS } from "@/features/settings/types";
import { makeProject, makeTag, makeTask } from "@/testing/factories";

import { CURRENT_SCHEMA_VERSION, buildBackup, parseBackup } from "./backup";

describe("export / import round trip", () => {
  it("restores exactly what was exported", () => {
    const project = makeProject({ name: "Work" });
    const tag = makeTag({ name: "urgent" });
    const task = makeTask({
      projectId: project.id,
      tagIds: [tag.id],
      dueDate: "2026-09-21",
      dueTime: "10:00",
      recurrence: { kind: "weekly", weekdays: [1] },
      reminder: { kind: "preset", preset: "1h" },
      subtasks: [{ id: "s", title: "step", completed: true }],
    });
    const data = {
      tasks: [task],
      projects: [project],
      tags: [tag],
      focusSessions: [],
      settings: { ...DEFAULT_SETTINGS, theme: "dark" as const, focusMinutes: 50 },
    };

    const parsed = parseBackup(JSON.stringify(buildBackup(data)));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data).toEqual(data);
    expect(parsed.summary).toMatchObject({ tasks: 1, projects: 1, tags: 1, skipped: 0, fromVersion: CURRENT_SCHEMA_VERSION });
  });
});

describe("parseBackup validation", () => {
  it("rejects files that are not JSON or not backups", () => {
    expect(parseBackup("{oops")).toMatchObject({ ok: false });
    expect(parseBackup("[]")).toMatchObject({ ok: false });
    expect(parseBackup('{"hello":"world"}')).toMatchObject({ ok: false });
    expect(parseBackup(JSON.stringify({ schemaVersion: CURRENT_SCHEMA_VERSION }))).toMatchObject({ ok: false });
  });

  it("rejects files from a newer app", () => {
    const result = parseBackup(JSON.stringify({ schemaVersion: CURRENT_SCHEMA_VERSION + 1, tasks: [] }));
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toMatch(/newer version/);
  });

  it("skips corrupt records and reports how many", () => {
    const good = makeTask({ title: "Good" });
    const result = parseBackup(
      JSON.stringify({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        tasks: [good, { id: "x" }, 42, { id: "y", title: "" }],
        projects: [{ id: "p", name: "" }],
        tags: [],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.tasks.map((t) => t.title)).toEqual(["Good"]);
    expect(result.summary.skipped).toBe(4);
  });

  it("merges duplicate names and drops dangling references", () => {
    const first = makeProject({ id: "p1", name: "Work" });
    const dupe = makeProject({ id: "p2", name: "work" });
    const tag = makeTag({ id: "g1", name: "a" });
    const task = makeTask({ projectId: "p2", tagIds: ["g1", "missing"] });
    const orphan = makeTask({ projectId: "nowhere" });
    const result = parseBackup(
      JSON.stringify({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        projects: [first, dupe],
        tags: [tag],
        tasks: [task, orphan],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.projects).toHaveLength(1);
    expect(result.data.tasks[0]).toMatchObject({ projectId: "p1", tagIds: ["g1"] });
    expect(result.data.tasks[1].projectId).toBeNull();
    expect(result.summary.skipped).toBe(1);
  });

  it("never restores a running focus session", () => {
    const task = makeTask({ id: "t" });
    const result = parseBackup(
      JSON.stringify({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        tasks: [task],
        focusSessions: [
          { id: "f", taskId: "t", durationMs: 60000, status: "running", startedAt: "2026-09-20T10:00:00.000Z", endsAt: 5 },
        ],
      }),
    );
    expect(result.ok && result.data.focusSessions[0].status).toBe("stopped");
  });
});

describe("migration from older files", () => {
  const v1 = {
    version: 1,
    tasks: [
      {
        id: "a",
        title: "Old task",
        notes: "some notes",
        done: true,
        priority: 1,
        due: new Date(2026, 8, 21, 17, 30).toISOString(),
        project: "Home",
        labels: ["Errand", "errand", "Quick"],
        created: "2026-01-01T00:00:00.000Z",
      },
      { id: "b", title: "Undated", done: false, priority: 3, due: new Date(2026, 8, 22, 0, 0).toISOString() },
    ],
  };

  it("upgrades a v1 file to the current model", () => {
    const result = parseBackup(JSON.stringify(v1));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary.fromVersion).toBe(1);
    const [a, b] = result.data.tasks;
    expect(a).toMatchObject({
      title: "Old task",
      description: "some notes",
      completed: true,
      priority: "high",
      dueDate: "2026-09-21",
      dueTime: "17:30",
    });
    expect(result.data.projects.map((p) => p.name)).toEqual(["Home"]);
    expect(a.projectId).toBe(result.data.projects[0].id);
    expect(result.data.tags.map((t) => t.name)).toEqual(["Errand", "Quick"]);
    expect(a.tagIds).toHaveLength(2);
    // Midnight is read as "date only".
    expect(b).toMatchObject({ priority: "low", dueDate: "2026-09-22", dueTime: null, completed: false });
  });
});
