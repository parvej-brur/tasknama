import { describe, expect, it } from "@jest/globals";

import { selectLiveSession } from "@/features/focus/selectors";
import { startSession } from "@/features/focus/session";
import { focusSessionSaved } from "@/features/focus/store";
import { createProject, deleteProject } from "@/features/projects/actions";
import { createTag, deleteTag } from "@/features/tags/actions";
import {
  addSubtask,
  completeTask,
  createTask,
  createTaskFromQuickAdd,
  deleteTask,
  moveSubtask,
  restoreTask,
  toggleSubtask,
  undoCompletion,
  updateTask,
} from "@/features/tasks/actions";
import { parseQuickAdd } from "@/features/tasks/quick-add";
import { selectAllTasks } from "@/features/tasks/selectors";
import { EMPTY_TASK_INPUT, type TaskInput } from "@/features/tasks/types";
import { createMemoryBackend } from "@/lib/storage/key-value-backend";

import { createAppStore } from "./create-store";
import { attachPersistence, loadState } from "./persistence";

const input = (overrides: Partial<TaskInput> = {}): TaskInput => ({
  ...EMPTY_TASK_INPUT,
  title: "Task",
  ...overrides,
});

function setup() {
  const backend = createMemoryBackend();
  const store = createAppStore();
  attachPersistence(store, backend);
  return { store, backend };
}

const keysOf = (backend: ReturnType<typeof createMemoryBackend>) => [...backend.data.keys()].sort();

describe("creating and editing tasks", () => {
  it("validates before saving and never stores an invalid task", () => {
    const { store } = setup();
    const result = store.dispatch(createTask(input({ title: "  " })));
    expect(result).toMatchObject({ ok: false });
    expect(selectAllTasks(store.getState())).toHaveLength(0);
  });

  it("blocks a double submit by reusing the same id", () => {
    const { store } = setup();
    store.dispatch(createTask(input(), { id: "same" }));
    store.dispatch(createTask(input(), { id: "same" }));
    expect(selectAllTasks(store.getState())).toHaveLength(1);
  });

  it("requires projects and tags to exist", () => {
    const { store } = setup();
    expect(store.dispatch(createTask(input({ projectId: "nope" })))).toMatchObject({ ok: false });
    const project = store.dispatch(createProject("Work", "teal"));
    const tag = store.dispatch(createTag("urgent"));
    if (!project.ok || !tag.ok) throw new Error("setup failed");
    expect(
      store.dispatch(createTask(input({ projectId: project.id, tagIds: [tag.id] }))),
    ).toMatchObject({ ok: true });
  });

  it("stamps created and updated dates and bumps updatedAt on edit", () => {
    const { store } = setup();
    const created = store.dispatch(createTask(input(), { id: "a", now: new Date("2026-01-01T00:00:00Z") }));
    if (!created.ok) throw new Error("create failed");
    store.dispatch(updateTask("a", input({ title: "Renamed" }), new Date("2026-02-01T00:00:00Z")));
    expect(store.getState().tasks.byId.a).toMatchObject({
      title: "Renamed",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    });
  });
});

describe("delete and undo", () => {
  it("undo restores the same id and data, including subtasks", () => {
    const { store } = setup();
    store.dispatch(createTask(input({ title: "Keep me", priority: "high", dueDate: "2026-09-21" }), { id: "a" }));
    store.dispatch(addSubtask("a", "step one"));
    const before = store.getState().tasks.byId.a;

    const deleted = store.dispatch(deleteTask("a"));
    expect(store.getState().tasks.byId.a).toBeUndefined();
    if (!deleted) throw new Error("nothing deleted");
    store.dispatch(restoreTask(deleted));
    expect(store.getState().tasks.byId.a).toEqual(before);
  });
});

describe("completing tasks", () => {
  const now = new Date(2026, 8, 21, 10, 0); // Monday

  it("completing a recurring task keeps history and creates the next one", () => {
    const { store } = setup();
    store.dispatch(
      createTask(
        input({
          title: "Water plants",
          dueDate: "2026-09-21",
          priority: "high",
          recurrence: { kind: "weekly", weekdays: [1] },
        }),
        { id: "a" },
      ),
    );
    store.dispatch(addSubtask("a", "Kitchen"));
    store.dispatch(toggleSubtask("a", store.getState().tasks.byId.a.subtasks[0].id));

    const result = store.dispatch(completeTask("a", now));
    const tasks = selectAllTasks(store.getState());
    expect(tasks).toHaveLength(2);
    expect(store.getState().tasks.byId.a).toMatchObject({ completed: true });
    const next = store.getState().tasks.byId[result?.nextId as string];
    expect(next).toMatchObject({ completed: false, dueDate: "2026-09-28", priority: "high" });
    expect(next.subtasks.every((s) => !s.completed)).toBe(true);
  });

  it("undoing a completion reopens the task and removes the follow-up", () => {
    const { store } = setup();
    store.dispatch(
      createTask(input({ dueDate: "2026-09-21", recurrence: { kind: "daily" } }), { id: "a" }),
    );
    const result = store.dispatch(completeTask("a", now));
    store.dispatch(undoCompletion("a", result?.nextId ?? null));
    expect(selectAllTasks(store.getState())).toHaveLength(1);
    expect(store.getState().tasks.byId.a.completed).toBe(false);
  });

  it("completing every subtask does not complete the parent", () => {
    const { store } = setup();
    store.dispatch(createTask(input(), { id: "a" }));
    store.dispatch(addSubtask("a", "one"));
    store.dispatch(addSubtask("a", "two"));
    for (const s of store.getState().tasks.byId.a.subtasks) store.dispatch(toggleSubtask("a", s.id));
    expect(store.getState().tasks.byId.a.subtasks.every((s) => s.completed)).toBe(true);
    expect(store.getState().tasks.byId.a.completed).toBe(false);
  });

  it("subtasks can be reordered", () => {
    const { store } = setup();
    store.dispatch(createTask(input(), { id: "a" }));
    store.dispatch(addSubtask("a", "one"));
    store.dispatch(addSubtask("a", "two"));
    const [first] = store.getState().tasks.byId.a.subtasks;
    store.dispatch(moveSubtask("a", first.id, 1));
    expect(store.getState().tasks.byId.a.subtasks.map((s) => s.title)).toEqual(["two", "one"]);
    store.dispatch(moveSubtask("a", first.id, 1)); // already last: no-op
    expect(store.getState().tasks.byId.a.subtasks.map((s) => s.title)).toEqual(["two", "one"]);
  });
});

describe("projects and tags", () => {
  it("names are required and unique ignoring case", () => {
    const { store } = setup();
    expect(store.dispatch(createProject(" ", "teal"))).toMatchObject({ ok: false });
    expect(store.dispatch(createProject("Work", "teal"))).toMatchObject({ ok: true });
    expect(store.dispatch(createProject("work", "rose"))).toMatchObject({ ok: false });
    expect(store.dispatch(createTag("Idea"))).toMatchObject({ ok: true });
    expect(store.dispatch(createTag("IDEA"))).toMatchObject({ ok: false });
  });

  it("deleting a project moves its tasks to Inbox", () => {
    const { store } = setup();
    const project = store.dispatch(createProject("Work", "teal"));
    if (!project.ok) throw new Error("setup failed");
    store.dispatch(createTask(input({ projectId: project.id }), { id: "a" }));
    store.dispatch(deleteProject(project.id));
    expect(store.getState().projects.byId[project.id]).toBeUndefined();
    expect(store.getState().tasks.byId.a.projectId).toBeNull();
  });

  it("deleting a tag removes it from all tasks", () => {
    const { store } = setup();
    const tag = store.dispatch(createTag("x"));
    const other = store.dispatch(createTag("y"));
    if (!tag.ok || !other.ok) throw new Error("setup failed");
    store.dispatch(createTask(input({ tagIds: [tag.id, other.id] }), { id: "a" }));
    store.dispatch(createTask(input({ tagIds: [tag.id] }), { id: "b" }));
    store.dispatch(deleteTag(tag.id));
    expect(store.getState().tasks.byId.a.tagIds).toEqual([other.id]);
    expect(store.getState().tasks.byId.b.tagIds).toEqual([]);
  });
});

describe("quick add", () => {
  it("creates unknown tags and links known ones", () => {
    const { store } = setup();
    const known = store.dispatch(createTag("career"));
    if (!known.ok) throw new Error("setup failed");
    const parsed = parseQuickAdd("Prep slides tomorrow 7pm high priority #career #fresh", {
      now: new Date(2026, 8, 20, 10, 0),
      existingTags: Object.values(store.getState().tags.byId),
    });
    const result = store.dispatch(createTaskFromQuickAdd(parsed));
    expect(result.ok).toBe(true);
    const tags = Object.values(store.getState().tags.byId).map((t) => t.name).sort();
    expect(tags).toEqual(["career", "fresh"]);
    const [task] = selectAllTasks(store.getState());
    expect(task).toMatchObject({ title: "Prep slides", priority: "high", dueDate: "2026-09-21", dueTime: "19:00" });
    expect(task.tagIds).toHaveLength(2);
  });

  it("refuses an empty title without creating tags", () => {
    const { store } = setup();
    const parsed = parseQuickAdd("#lonely", { now: new Date(), existingTags: [] });
    expect(store.dispatch(createTaskFromQuickAdd(parsed))).toMatchObject({ ok: false });
    expect(Object.keys(store.getState().tags.byId)).toHaveLength(0);
  });
});

describe("persistence", () => {
  it("writes one record per task and only the ones that changed", () => {
    const { store, backend } = setup();
    store.dispatch(createTask(input({ title: "A" }), { id: "a" }));
    store.dispatch(createTask(input({ title: "B" }), { id: "b" }));
    expect(keysOf(backend)).toEqual(["task:a", "task:b"]);

    const writes: string[] = [];
    const originalSet = backend.set;
    backend.set = (key, value) => {
      writes.push(key);
      originalSet(key, value);
    };
    store.dispatch(updateTask("a", input({ title: "A2" })));
    expect(writes).toEqual(["task:a"]);
  });

  it("removes deleted records and does not write when nothing changed", () => {
    const { store, backend } = setup();
    store.dispatch(createTask(input(), { id: "a" }));
    store.dispatch(deleteTask("a"));
    expect(keysOf(backend)).toEqual([]);

    let writes = 0;
    backend.set = () => {
      writes += 1;
    };
    store.dispatch({ type: "unrelated" });
    expect(writes).toBe(0);
  });

  it("survives a restart: state loaded from storage matches", () => {
    const { store, backend } = setup();
    store.dispatch(createProject("Work", "rose", { id: "p" }));
    store.dispatch(createTask(input({ title: "Persist me", projectId: "p" }), { id: "a" }));
    const reloaded = createAppStore(loadState(backend).state);
    expect(reloaded.getState().tasks.byId.a).toEqual(store.getState().tasks.byId.a);
    expect(reloaded.getState().projects.byId.p).toEqual(store.getState().projects.byId.p);
  });

  it("skips corrupt records instead of failing to start", () => {
    const backend = createMemoryBackend({
      "task:good": JSON.stringify({ id: "good", title: "Fine" }),
      "task:bad-json": "{not json",
      "task:no-title": JSON.stringify({ id: "no-title" }),
      "task:wrong-key": JSON.stringify({ id: "other", title: "Misfiled" }),
      "project:p": "null",
      "focus:f": JSON.stringify({ id: "f" }),
      settings: "%%%",
    });
    const { state, skipped } = loadState(backend);
    expect(Object.keys(state.tasks?.byId ?? {})).toEqual(["good"]);
    expect(skipped).toBe(6);
    expect(state.settings).toMatchObject({ theme: "system", focusMinutes: 25 });
  });

  it("a focus session whose end time passed while closed comes back completed", () => {
    const { store, backend } = setup();
    store.dispatch(focusSessionSaved(startSession("f", "t", 25 * 60_000, 1_000)));
    expect(selectLiveSession(store.getState())?.id).toBe("f");

    const later = loadState(backend, 1_000 + 26 * 60_000).state;
    const restored = createAppStore(later);
    expect(restored.getState().focus.sessionsById.f.status).toBe("completed");
    expect(selectLiveSession(restored.getState())).toBeNull();
  });

  it("swallows storage failures and reports them", () => {
    const { store, backend } = setup();
    backend.set = () => {
      throw new Error("disk full");
    };
    expect(() => store.dispatch(createTask(input(), { id: "a" }))).not.toThrow();
    expect(store.getState().tasks.byId.a).toBeDefined();
  });
});
