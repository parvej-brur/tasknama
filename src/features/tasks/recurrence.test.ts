import { describe, expect, it } from "@jest/globals";

import { makeTask } from "@/testing/factories";

import { buildNextOccurrence } from "./completion";
import { describeRecurrence, nextDueDate, validateRecurrence } from "./recurrence";
import type { Recurrence } from "./types";

// 2026-09-21 is a Monday.
describe("nextDueDate", () => {
  it("daily moves one day forward", () => {
    expect(nextDueDate({ kind: "daily" }, "2026-09-21", "2026-09-21")).toBe("2026-09-22");
  });

  it("weekly picks the next chosen weekday after the due date", () => {
    const rule: Recurrence = { kind: "weekly", weekdays: [1, 3] }; // Mon, Wed
    expect(nextDueDate(rule, "2026-09-21", "2026-09-21")).toBe("2026-09-23");
    expect(nextDueDate(rule, "2026-09-23", "2026-09-23")).toBe("2026-09-28");
  });

  it("a single weekday repeats a week later, never the same day", () => {
    expect(nextDueDate({ kind: "weekly", weekdays: [1] }, "2026-09-21", "2026-09-21")).toBe("2026-09-28");
  });

  it("monthly keeps the day of month", () => {
    expect(nextDueDate({ kind: "monthly", dayOfMonth: 15 }, "2026-09-15", "2026-09-15")).toBe("2026-10-15");
  });

  it("day 31 clamps to month end without drifting", () => {
    const rule: Recurrence = { kind: "monthly", dayOfMonth: 31 };
    expect(nextDueDate(rule, "2026-01-31", "2026-01-31")).toBe("2026-02-28");
    expect(nextDueDate(rule, "2026-02-28", "2026-02-28")).toBe("2026-03-31");
    expect(nextDueDate(rule, "2028-01-31", "2028-01-31")).toBe("2028-02-29");
  });

  it("custom intervals in days, weeks and months", () => {
    expect(nextDueDate({ kind: "custom", interval: 3, unit: "day" }, "2026-09-21", "2026-09-21")).toBe("2026-09-24");
    expect(nextDueDate({ kind: "custom", interval: 2, unit: "week" }, "2026-09-21", "2026-09-21")).toBe("2026-10-05");
    expect(nextDueDate({ kind: "custom", interval: 2, unit: "month" }, "2026-09-21", "2026-09-21")).toBe("2026-11-21");
  });

  it("completing an overdue task gives today or later, keeping the cadence", () => {
    // Weekly on Monday, 3 weeks overdue, today is Wednesday 2026-09-30.
    expect(nextDueDate({ kind: "weekly", weekdays: [1] }, "2026-09-07", "2026-09-30")).toBe("2026-10-05");
    // Every 3 days from the 1st; today is the 10th → 1,4,7,10 → next is the 10th.
    expect(nextDueDate({ kind: "custom", interval: 3, unit: "day" }, "2026-09-01", "2026-09-10")).toBe("2026-09-10");
    expect(nextDueDate({ kind: "daily" }, "2026-01-01", "2026-09-10")).toBe("2026-09-10");
  });

  it("is always after the current due date", () => {
    const rules: Recurrence[] = [
      { kind: "daily" },
      { kind: "weekly", weekdays: [0, 1, 2, 3, 4, 5, 6] },
      { kind: "monthly", dayOfMonth: 30 },
      { kind: "custom", interval: 1, unit: "week" },
    ];
    for (const rule of rules) {
      expect(nextDueDate(rule, "2026-09-21", "2026-09-01") > "2026-09-21").toBe(true);
    }
  });
});

describe("buildNextOccurrence", () => {
  it("copies project, tags, priority and reminder and resets subtasks", () => {
    const task = makeTask({
      id: "orig",
      title: "Water plants",
      priority: "high",
      projectId: "home",
      tagIds: ["a", "b"],
      dueDate: "2026-09-21",
      dueTime: "08:00",
      recurrence: { kind: "daily" },
      reminder: { kind: "preset", preset: "10m" },
      subtasks: [
        { id: "s1", title: "Kitchen", completed: true },
        { id: "s2", title: "Hall", completed: true },
      ],
    });
    const next = buildNextOccurrence(task, "2026-09-21", "new-id", "2026-09-21T09:00:00.000Z");

    expect(next).toMatchObject({
      id: "new-id",
      title: "Water plants",
      priority: "high",
      projectId: "home",
      tagIds: ["a", "b"],
      dueDate: "2026-09-22",
      dueTime: "08:00",
      completed: false,
      completedAt: null,
      reminder: { kind: "preset", preset: "10m" },
      recurrence: { kind: "daily" },
    });
    expect(next?.subtasks.every((s) => !s.completed)).toBe(true);
    expect(next?.subtasks.map((s) => s.id)).toEqual(["s1", "s2"]);
  });

  it("shifts a custom reminder by the same number of days as the due date", () => {
    const task = makeTask({
      dueDate: "2026-09-21",
      recurrence: { kind: "custom", interval: 7, unit: "day" },
      reminder: { kind: "custom", at: new Date(2026, 8, 20, 18, 0).toISOString() },
    });
    const next = buildNextOccurrence(task, "2026-09-21", "n", "x");
    expect(next?.reminder?.kind).toBe("custom");
    if (next?.reminder?.kind === "custom") {
      const at = new Date(next.reminder.at);
      expect([at.getFullYear(), at.getMonth(), at.getDate(), at.getHours()]).toEqual([2026, 8, 27, 18]);
    }
  });

  it("returns null when the task doesn't repeat", () => {
    expect(buildNextOccurrence(makeTask({ dueDate: "2026-09-21" }), "2026-09-21", "n", "x")).toBeNull();
  });
});

describe("recurrence helpers", () => {
  it("describes rules for display", () => {
    expect(describeRecurrence({ kind: "daily" })).toBe("Every day");
    expect(describeRecurrence({ kind: "weekly", weekdays: [3, 1] })).toBe("Every Mon, Wed");
    expect(describeRecurrence({ kind: "monthly", dayOfMonth: 31 })).toBe("Monthly on day 31");
    expect(describeRecurrence({ kind: "custom", interval: 3, unit: "week" })).toBe("Every 3 weeks");
  });

  it("rejects malformed rules", () => {
    expect(validateRecurrence({ kind: "weekly", weekdays: [] })).not.toBeNull();
    expect(validateRecurrence({ kind: "monthly", dayOfMonth: 32 })).not.toBeNull();
    expect(validateRecurrence({ kind: "custom", interval: 0, unit: "day" })).not.toBeNull();
    expect(validateRecurrence({ kind: "custom", interval: 2, unit: "week" })).toBeNull();
  });
});
