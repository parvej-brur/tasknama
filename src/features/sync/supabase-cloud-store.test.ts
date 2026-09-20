import { beforeEach, describe, expect, it } from "@jest/globals";

import { createSupabaseClient } from "@/lib/supabase/client";
import { createFakeSupabase, type FakeSupabase } from "@/testing/fake-supabase";
import { makeProject, makeTag, makeTask } from "@/testing/factories";

import { CloudSyncError, SupabaseCloudStore, type CloudData } from "./supabase-cloud-store";

let fake: FakeSupabase;
let store: SupabaseCloudStore;

beforeEach(() => {
  fake = createFakeSupabase();
  store = new SupabaseCloudStore(
    createSupabaseClient({ url: "https://demo.supabase.co", anonKey: "anon" }, { fetch: fake.fetch }),
  );
});

function sampleData(): CloudData {
  const project = makeProject({ id: "p-work", name: "Work" });
  const tag = makeTag({ id: "g-urgent", name: "urgent" });
  const task = makeTask({
    id: "t-1",
    projectId: project.id,
    tagIds: [tag.id],
    dueDate: "2026-09-21",
    dueTime: "14:30",
    priority: "high",
    recurrence: { kind: "weekly", weekdays: [1, 3] },
    reminder: { kind: "preset", preset: "1h" },
    subtasks: [{ id: "s1", title: "step", completed: true }],
  });
  return {
    tasks: [task],
    projects: [project],
    tags: [tag],
    focusSessions: [
      {
        id: "f-1",
        taskId: task.id,
        durationMs: 1_500_000,
        status: "completed",
        startedAt: "2026-09-21T09:00:00.000Z",
        endsAt: null,
        remainingMs: null,
        finishedAt: "2026-09-21T09:25:00.000Z",
        acknowledged: true,
      },
    ],
  };
}

describe("SupabaseCloudStore.replace", () => {
  it("writes every record to its table using the schema's column names", async () => {
    await store.replace(sampleData());

    expect([...fake.tables.tm_projects.keys()]).toEqual(["p-work"]);
    expect([...fake.tables.tm_tags.keys()]).toEqual(["g-urgent"]);
    expect(fake.tables.tm_tasks.get("t-1")).toMatchObject({
      title: expect.any(String),
      project_id: "p-work",
      tag_ids: ["g-urgent"],
      due_date: "2026-09-21",
      due_time: "14:30",
      priority: "high",
      recurrence: { kind: "weekly", weekdays: [1, 3] },
      reminder: { kind: "preset", preset: "1h" },
      subtasks: [{ id: "s1", title: "step", completed: true }],
    });
    expect(fake.tables.tm_focus_sessions.get("f-1")).toMatchObject({ task_id: "t-1", duration_ms: 1_500_000 });
  });

  it("removes cloud records that no longer exist on the device", async () => {
    await store.replace(sampleData());
    const next = sampleData();
    next.tasks = [makeTask({ id: "t-2" })];
    next.projects = [];
    next.tags = [];
    next.focusSessions = [];

    await store.replace(next);

    expect([...fake.tables.tm_tasks.keys()]).toEqual(["t-2"]);
    expect(fake.tables.tm_projects.size).toBe(0);
    expect(fake.tables.tm_tags.size).toBe(0);
    expect(fake.tables.tm_focus_sessions.size).toBe(0);
  });

  it("can be repeated without changing the result", async () => {
    await store.replace(sampleData());
    await store.replace(sampleData());
    expect(fake.tables.tm_tasks.size).toBe(1);
    expect(fake.tables.tm_projects.size).toBe(1);
  });

  it("writes parents before children", async () => {
    // The fake rejects a task whose project is missing (and a session whose
    // task is missing), so this only passes with the right write order.
    await expect(store.replace(sampleData())).resolves.toBeUndefined();
  });

  it("clears every table when the device has no data", async () => {
    await store.replace(sampleData());
    await store.replace({ tasks: [], projects: [], tags: [], focusSessions: [] });
    for (const table of Object.values(fake.tables)) expect(table.size).toBe(0);
  });

  it("uploads a task whose project link dangles, unlinked, and skips orphan sessions", async () => {
    const data = sampleData();
    data.tasks = [{ ...data.tasks[0], projectId: "p-gone" }];
    data.focusSessions = [...data.focusSessions, { ...data.focusSessions[0], id: "f-orphan", taskId: "t-gone" }];

    await store.replace(data);

    expect(fake.tables.tm_tasks.get("t-1")?.project_id).toBeNull();
    expect([...fake.tables.tm_focus_sessions.keys()]).toEqual(["f-1"]);
  });

  it("splits large uploads into chunks", async () => {
    const tasks = Array.from({ length: 1201 }, (_, i) => makeTask({ id: `bulk-${String(i).padStart(4, "0")}` }));
    await store.replace({ tasks, projects: [], tags: [], focusSessions: [] });

    expect(fake.tables.tm_tasks.size).toBe(1201);
    const posts = fake.requests.filter((r) => r.method === "POST" && r.table === "tm_tasks");
    expect(posts).toHaveLength(3);
  });

  it("deletes stale records in bounded batches", async () => {
    const stale = Array.from({ length: 250 }, (_, i) => makeTask({ id: `old-${String(i).padStart(3, "0")}` }));
    await store.replace({ tasks: stale, projects: [], tags: [], focusSessions: [] });
    fake.requests.length = 0;

    await store.replace({ tasks: [], projects: [], tags: [], focusSessions: [] });

    expect(fake.tables.tm_tasks.size).toBe(0);
    expect(fake.requests.filter((r) => r.method === "DELETE" && r.table === "tm_tasks")).toHaveLength(3);
  });

  it("surfaces a failed write as a CloudSyncError", async () => {
    fake.failNext("POST", "tm_tasks", 401);
    const failure = store.replace(sampleData());
    await expect(failure).rejects.toBeInstanceOf(CloudSyncError);
    await expect(failure).rejects.toThrow(/write tm_tasks/);
  });
});

describe("SupabaseCloudStore.fetch", () => {
  it("reads back what was uploaded", async () => {
    const data = sampleData();
    await store.replace(data);

    const raw = await store.fetch();

    expect(raw.tasks).toHaveLength(1);
    expect(raw.tasks[0]).toMatchObject({
      id: "t-1",
      projectId: "p-work",
      tagIds: ["g-urgent"],
      dueDate: "2026-09-21",
      dueTime: "14:30",
      createdAt: data.tasks[0].createdAt,
    });
    expect(raw.projects[0]).toMatchObject({ id: "p-work", name: "Work", archived: false });
    expect(raw.focusSessions[0]).toMatchObject({ id: "f-1", taskId: "t-1", durationMs: 1_500_000 });
  });

  it("reads every page, not just the first", async () => {
    for (let i = 0; i < 2300; i += 1) {
      const id = `row-${String(i).padStart(4, "0")}`;
      fake.tables.tm_tags.set(id, { id, name: id, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" });
    }
    const raw = await store.fetch();
    expect(raw.tags).toHaveLength(2300);
  });

  it("still reads everything when the server caps rows below the page size", async () => {
    fake.maxRows = 300;
    for (let i = 0; i < 1000; i += 1) {
      const id = `row-${String(i).padStart(4, "0")}`;
      fake.tables.tm_tags.set(id, { id, name: id, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" });
    }
    const raw = await store.fetch();
    expect(raw.tags).toHaveLength(1000);
  });

  it("surfaces a failed read as a CloudSyncError", async () => {
    fake.failNext("GET", "tm_tasks", 500);
    await expect(store.fetch()).rejects.toThrow(/read tm_tasks/);
  });
});
