import { describe, expect, it } from "@jest/globals";

import { makeTask } from "@/testing/factories";

import {
  diffReminders,
  planReminders,
  reminderFireAt,
  reminderIdentifier,
  reminderSignature,
  MAX_SCHEDULED_REMINDERS,
} from "./reminder-planner";
import type { ReminderPreset } from "./types";

const at = (d: number, h: number, m = 0) => new Date(2026, 8, d, h, m).getTime();
const now = at(20, 10);

describe("reminderFireAt", () => {
  const base = { dueDate: "2026-09-21", dueTime: "17:00" };

  const cases: [ReminderPreset, number][] = [
    ["atDue", at(21, 17)],
    ["10m", at(21, 16, 50)],
    ["1h", at(21, 16)],
    ["1d", at(20, 17)],
  ];
  it.each(cases)("preset %s", (preset, expected) => {
    const task = makeTask({ ...base, reminder: { kind: "preset", preset } });
    expect(reminderFireAt(task)?.getTime()).toBe(expected);
  });

  it("uses 09:00 for a date with no time", () => {
    const task = makeTask({ dueDate: "2026-09-21", reminder: { kind: "preset", preset: "atDue" } });
    expect(reminderFireAt(task)?.getTime()).toBe(at(21, 9));
  });

  it("uses the exact instant for a custom reminder", () => {
    const custom = new Date(2026, 8, 22, 6, 30);
    const task = makeTask({ reminder: { kind: "custom", at: custom.toISOString() } });
    expect(reminderFireAt(task)?.getTime()).toBe(custom.getTime());
  });

  it("is null without a reminder or without a date for a preset", () => {
    expect(reminderFireAt(makeTask(base))).toBeNull();
    expect(reminderFireAt(makeTask({ reminder: { kind: "preset", preset: "1h" } }))).toBeNull();
  });
});

describe("planReminders", () => {
  const withReminder = (day: number) =>
    makeTask({
      dueDate: `2026-09-${String(day).padStart(2, "0")}`,
      dueTime: "12:00",
      reminder: { kind: "preset", preset: "atDue" },
    });

  it("skips completed tasks and reminders in the past", () => {
    const tasks = [
      makeTask({ ...withReminder(22), completed: true }),
      withReminder(19),
      withReminder(23),
    ];
    expect(planReminders(tasks, now)).toHaveLength(1);
  });

  it("keeps only the next 50, soonest first, to respect the iOS limit of 64", () => {
    const tasks = Array.from({ length: 80 }, (_, i) =>
      makeTask({
        dueDate: "2026-10-01",
        dueTime: "12:00",
        reminder: { kind: "custom", at: new Date(2026, 8, 21, 0, i + 1).toISOString() },
      }),
    );
    const plan = planReminders([...tasks].reverse(), now);
    expect(plan).toHaveLength(MAX_SCHEDULED_REMINDERS);
    expect(plan[0].fireAt).toBe(at(21, 0, 1));
    expect(plan[49].fireAt).toBe(at(21, 0, 50));
  });
});

describe("diffReminders", () => {
  const plan = (id: string, fireAt: number, title = "T") => ({
    taskId: id,
    fireAt,
    title,
    body: "Due",
  });

  it("schedules new reminders and leaves matching ones alone", () => {
    const kept = plan("a", 1000);
    const result = diffReminders(
      [kept, plan("b", 2000)],
      [{ identifier: reminderIdentifier("a"), signature: reminderSignature(kept) }],
    );
    expect(result.cancel).toEqual([]);
    expect(result.schedule.map((r) => r.taskId)).toEqual(["b"]);
  });

  it("cancels reminders that are no longer planned (completed or deleted tasks)", () => {
    const result = diffReminders([], [{ identifier: reminderIdentifier("gone"), signature: "x" }]);
    expect(result.cancel).toEqual([reminderIdentifier("gone")]);
  });

  it("reschedules when the time or title changed", () => {
    const old = plan("a", 1000);
    const result = diffReminders(
      [plan("a", 5000, "Renamed")],
      [{ identifier: reminderIdentifier("a"), signature: reminderSignature(old) }],
    );
    expect(result.cancel).toEqual([reminderIdentifier("a")]);
    expect(result.schedule).toHaveLength(1);
  });

  it("drops reminders that fell out of the top 50 window", () => {
    const result = diffReminders([], [
      { identifier: reminderIdentifier("late"), signature: "x" },
    ]);
    expect(result.schedule).toEqual([]);
    expect(result.cancel).toHaveLength(1);
  });
});
