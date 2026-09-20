import { describe, expect, it } from "@jest/globals";

import type { FocusSession } from "@/features/focus/types";
import { makeTask } from "@/testing/factories";
import { clockAt } from "@/utils/date";

import { computeAnalytics } from "./analytics";

const MIN = 60_000;

describe("computeAnalytics", () => {
  // Wednesday 2026-09-23 12:00. Week = Mon 09-21 … Sun 09-27.
  const clock = clockAt(new Date(2026, 8, 23, 12, 0));
  const iso = (d: number, h = 9) => new Date(2026, 8, d, h).toISOString();

  const session = (overrides: Partial<FocusSession>): FocusSession => ({
    id: Math.random().toString(),
    taskId: "t",
    durationMs: 25 * MIN,
    status: "completed",
    startedAt: iso(23, 8),
    endsAt: null,
    remainingMs: 0,
    finishedAt: iso(23, 9),
    ...overrides,
  });

  it("counts completions today and this week (week starts Monday)", () => {
    const tasks = [
      makeTask({ completed: true, completedAt: iso(23) }),
      makeTask({ completed: true, completedAt: iso(22) }),
      makeTask({ completed: true, completedAt: iso(21) }),
      makeTask({ completed: true, completedAt: iso(20) }), // Sunday of last week
      makeTask(),
    ];
    const result = computeAnalytics(tasks, [], clock);
    expect(result.completedToday).toBe(1);
    expect(result.completedThisWeek).toBe(3);
  });

  it("completion rate covers tasks due this week", () => {
    const tasks = [
      makeTask({ dueDate: "2026-09-21", completed: true, completedAt: iso(21) }),
      makeTask({ dueDate: "2026-09-24" }),
      makeTask({ dueDate: "2026-09-27", completed: true, completedAt: iso(22) }),
      makeTask({ dueDate: "2026-09-28" }), // next week
      makeTask({ dueDate: "2026-09-20" }), // last week
    ];
    const result = computeAnalytics(tasks, [], clock);
    expect(result.dueThisWeek).toBe(3);
    expect(result.completionRate).toBe(67);
    expect(computeAnalytics([], [], clock).completionRate).toBeNull();
  });

  it("counts overdue tasks", () => {
    const tasks = [
      makeTask({ dueDate: "2026-09-22" }),
      makeTask({ dueDate: "2026-09-22", completed: true, completedAt: iso(22) }),
      makeTask({ dueDate: "2026-09-25" }),
    ];
    expect(computeAnalytics(tasks, [], clock).overdue).toBe(1);
  });

  it("counts only completed focus sessions", () => {
    const sessions = [
      session({}),
      session({ finishedAt: iso(21) }),
      session({ finishedAt: iso(20) }),
      session({ status: "stopped" }),
    ];
    const result = computeAnalytics([], sessions, clock);
    expect(result.focusToday).toBe(1);
    expect(result.focusThisWeek).toBe(2);
  });
});
