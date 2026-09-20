import { describe, expect, it } from "@jest/globals";

import { makeTask } from "@/testing/factories";
import { clockAt } from "@/utils/date";

import { DEFAULT_QUERY, queryTasks, type TaskQuery } from "./task-query";

// Sunday 2026-09-20 10:00. The week is Mon 09-14 … Sun 09-20.
const clock = clockAt(new Date(2026, 8, 20, 10, 0));
const q = (overrides: Partial<TaskQuery>): TaskQuery => ({ ...DEFAULT_QUERY, ...overrides });

describe("queryTasks", () => {
  const tasks = [
    makeTask({ title: "Write Report", description: "quarterly numbers", priority: "high", dueDate: "2026-09-18", projectId: "work", tagIds: ["x"], createdAt: "2026-01-03T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" }),
    makeTask({ title: "Buy milk", priority: "low", dueDate: "2026-09-20", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-03-01T00:00:00.000Z" }),
    makeTask({ title: "Plan trip", description: "REPORT to boss", priority: "medium", dueDate: "2026-09-30", projectId: "home", tagIds: ["x", "y"], createdAt: "2026-01-02T00:00:00.000Z", updatedAt: "2026-01-15T00:00:00.000Z" }),
    makeTask({ title: "Done thing", completed: true, completedAt: "2026-09-01T00:00:00.000Z", priority: "high", createdAt: "2026-01-04T00:00:00.000Z", updatedAt: "2026-01-20T00:00:00.000Z" }),
  ];
  const titles = (list: ReturnType<typeof queryTasks>) => list.map((t) => t.title);

  it("searches title and description, ignoring case", () => {
    expect(titles(queryTasks(tasks, q({ search: "REPORT" }), clock))).toEqual(["Write Report", "Plan trip"]);
    expect(titles(queryTasks(tasks, q({ search: "  milk " }), clock))).toEqual(["Buy milk"]);
  });

  it("filters by status, priority, project, tag and due", () => {
    expect(titles(queryTasks(tasks, q({ status: "completed" }), clock))).toEqual(["Done thing"]);
    expect(titles(queryTasks(tasks, q({ status: "active", priority: "high" }), clock))).toEqual(["Write Report"]);
    expect(titles(queryTasks(tasks, q({ projectId: "home" }), clock))).toEqual(["Plan trip"]);
    expect(titles(queryTasks(tasks, q({ tagId: "x" }), clock))).toEqual(["Write Report", "Plan trip"]);
    expect(titles(queryTasks(tasks, q({ due: "overdue" }), clock))).toEqual(["Write Report"]);
    expect(titles(queryTasks(tasks, q({ due: "today" }), clock))).toEqual(["Buy milk"]);
    expect(titles(queryTasks(tasks, q({ due: "week" }), clock))).toEqual(["Write Report", "Buy milk"]);
    expect(titles(queryTasks(tasks, q({ due: "none" }), clock))).toEqual(["Done thing"]);
  });

  it("sorts by each key in both directions", () => {
    expect(titles(queryTasks(tasks, q({ sortKey: "dueDate", sortDir: "asc" }), clock))).toEqual(["Write Report", "Buy milk", "Plan trip", "Done thing"]);
    // Undated tasks stay last even when descending.
    expect(titles(queryTasks(tasks, q({ sortKey: "dueDate", sortDir: "desc" }), clock))).toEqual(["Plan trip", "Buy milk", "Write Report", "Done thing"]);
    expect(titles(queryTasks(tasks, q({ sortKey: "priority", sortDir: "desc" }), clock))[2]).toBe("Plan trip");
    expect(titles(queryTasks(tasks, q({ sortKey: "priority", sortDir: "asc" }), clock))[0]).toBe("Buy milk");
    expect(titles(queryTasks(tasks, q({ sortKey: "createdAt", sortDir: "asc" }), clock))).toEqual(["Buy milk", "Plan trip", "Write Report", "Done thing"]);
    expect(titles(queryTasks(tasks, q({ sortKey: "updatedAt", sortDir: "desc" }), clock))[0]).toBe("Buy milk");
  });

  it("search, filter and sort work together", () => {
    const result = queryTasks(
      tasks,
      q({ search: "report", tagId: "x", status: "active", sortKey: "dueDate", sortDir: "desc" }),
      clock,
    );
    expect(titles(result)).toEqual(["Plan trip", "Write Report"]);
  });
});
