import { describe, expect, it } from "@jest/globals";

import { coerceTask } from "@/features/tasks/schemas";
import { DEFAULT_QUERY, queryTasks } from "@/features/tasks/task-query";
import { selectToday } from "@/features/tasks/task-views";
import { clockAt } from "@/utils/date";

import { generateSeedTasks } from "./dev-seed";

describe("dev seed", () => {
  const now = new Date(2026, 8, 20, 10, 0);
  const tasks = generateSeedTasks(5000, now, ["p1", "p2"], ["t1"]);

  it("creates 5,000 unique, valid tasks", () => {
    expect(tasks).toHaveLength(5000);
    expect(new Set(tasks.map((t) => t.id)).size).toBe(5000);
    expect(tasks.every((t) => coerceTask(t) !== null)).toBe(true);
  });

  it("is reproducible", () => {
    expect(generateSeedTasks(50, now)).toEqual(generateSeedTasks(50, now));
  });

  it("filtering, sorting and the Today view stay fast at 5,000 tasks", () => {
    const clock = clockAt(now);
    const start = Date.now();
    queryTasks(tasks, { ...DEFAULT_QUERY, search: "report", sortKey: "priority", sortDir: "desc" }, clock);
    selectToday(tasks, clock);
    // A generous ceiling: this is a regression guard, not a benchmark.
    expect(Date.now() - start).toBeLessThan(500);
  });
});
