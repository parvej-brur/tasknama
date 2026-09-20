import { describe, expect, it } from "@jest/globals";

import { hasErrors } from "@/utils/validation";

import { coerceTask, normalizeTaskInput, validateTaskInput } from "./schemas";
import { EMPTY_TASK_INPUT, type TaskInput } from "./types";

const context = { projectIds: new Set(["p1"]), tagIds: new Set(["t1", "t2"]) };
const input = (overrides: Partial<TaskInput> = {}): TaskInput => ({
  ...EMPTY_TASK_INPUT,
  title: "Buy milk",
  ...overrides,
});

describe("validateTaskInput", () => {
  it("accepts a minimal task", () => {
    expect(hasErrors(validateTaskInput(input(), context))).toBe(false);
  });

  it("requires a title of at most 200 characters", () => {
    expect(validateTaskInput(input({ title: "   " }), context).title).toBeDefined();
    expect(validateTaskInput(input({ title: "a".repeat(200) }), context).title).toBeUndefined();
    expect(validateTaskInput(input({ title: "a".repeat(201) }), context).title).toBeDefined();
  });

  it("limits the description to 2000 characters", () => {
    expect(validateTaskInput(input({ description: "a".repeat(2000) }), context).description).toBeUndefined();
    expect(validateTaskInput(input({ description: "a".repeat(2001) }), context).description).toBeDefined();
  });

  it("rejects impossible dates and malformed times", () => {
    expect(validateTaskInput(input({ dueDate: "2026-02-30" }), context).dueDate).toBeDefined();
    expect(validateTaskInput(input({ dueDate: "tomorrow" }), context).dueDate).toBeDefined();
    expect(validateTaskInput(input({ dueDate: "2026-02-28", dueTime: "25:00" }), context).dueTime).toBeDefined();
    expect(validateTaskInput(input({ dueDate: "2028-02-29", dueTime: "07:30" }), context)).toEqual({});
  });

  it("a time needs a date", () => {
    expect(validateTaskInput(input({ dueTime: "09:00" }), context).dueTime).toBe("A time needs a date.");
  });

  it("recurrence needs a date and a valid rule", () => {
    expect(validateTaskInput(input({ recurrence: { kind: "daily" } }), context).recurrence).toBeDefined();
    expect(
      validateTaskInput(input({ dueDate: "2026-09-21", recurrence: { kind: "weekly", weekdays: [] } }), context).recurrence,
    ).toBeDefined();
    expect(
      hasErrors(validateTaskInput(input({ dueDate: "2026-09-21", recurrence: { kind: "daily" } }), context)),
    ).toBe(false);
  });

  it("a preset reminder needs a due date but a custom one does not", () => {
    expect(
      validateTaskInput(input({ reminder: { kind: "preset", preset: "1h" } }), context).reminder,
    ).toBeDefined();
    expect(
      hasErrors(validateTaskInput(input({ reminder: { kind: "custom", at: "2026-09-21T10:00:00.000Z" } }), context)),
    ).toBe(false);
  });

  it("the project and tags must exist", () => {
    expect(validateTaskInput(input({ projectId: "gone" }), context).project).toBeDefined();
    expect(validateTaskInput(input({ projectId: "p1", tagIds: ["t1"] }), context)).toEqual({});
    expect(validateTaskInput(input({ tagIds: ["t1", "nope"] }), context).tags).toBeDefined();
  });
});

describe("normalizeTaskInput", () => {
  it("trims text, dedupes tags, drops blank subtasks and dependents of a missing date", () => {
    const result = normalizeTaskInput(
      input({
        title: "  Hi  ",
        description: " note ",
        tagIds: ["a", "a", "b"],
        dueTime: "10:00",
        recurrence: { kind: "daily" },
        subtasks: [
          { id: "1", title: " one ", completed: false },
          { id: "2", title: "  ", completed: false },
        ],
      }),
    );
    expect(result).toMatchObject({ title: "Hi", description: "note", tagIds: ["a", "b"], dueTime: null, recurrence: null });
    expect(result.subtasks).toEqual([{ id: "1", title: "one", completed: false }]);
  });
});

describe("coerceTask", () => {
  it("skips records that can't be repaired", () => {
    expect(coerceTask(null)).toBeNull();
    expect(coerceTask("nope")).toBeNull();
    expect(coerceTask({ title: "no id" })).toBeNull();
    expect(coerceTask({ id: "1", title: "   " })).toBeNull();
  });

  it("repairs bad optional fields instead of failing", () => {
    const task = coerceTask({
      id: "1",
      title: "Ok",
      priority: "urgent!!",
      dueDate: "not-a-date",
      dueTime: "09:00",
      recurrence: { kind: "daily" },
      tagIds: ["a", 5, "a"],
      subtasks: [{ id: "s", title: "x", completed: true }, { nope: true }],
      reminder: { kind: "custom", at: "garbage" },
    });
    expect(task).toMatchObject({
      priority: "medium",
      dueDate: null,
      dueTime: null,
      recurrence: null,
      tagIds: ["a"],
      reminder: null,
      completed: false,
    });
    expect(task?.subtasks).toHaveLength(1);
  });
});
