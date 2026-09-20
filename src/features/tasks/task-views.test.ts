import { describe, expect, it } from "@jest/globals";

import { archivedProjectIds, projectProgress } from "@/features/projects/project-utils";
import { makeProject, makeTask } from "@/testing/factories";
import { clockAt } from "@/utils/date";

import {
  isOverdue,
  selectCompleted,
  selectInbox,
  selectToday,
  selectUpcoming,
  subtaskProgress,
} from "./task-views";

// Sunday 2026-09-20 10:00. The week is Mon 09-14 … Sun 09-20.
const clock = clockAt(new Date(2026, 8, 20, 10, 0));

describe("views", () => {
  it("inbox is active tasks with no project", () => {
    const inbox = makeTask();
    const tasks = [
      inbox,
      makeTask({ projectId: "p" }),
      makeTask({ completed: true, completedAt: "2026-09-19T10:00:00.000Z" }),
    ];
    expect(selectInbox(tasks)).toEqual([inbox]);
  });

  it("today lists overdue first and separates due-today tasks", () => {
    const late = makeTask({ dueDate: "2026-09-18" });
    const earlyToday = makeTask({ dueDate: "2026-09-20", dueTime: "08:00" }); // passed → overdue
    const laterToday = makeTask({ dueDate: "2026-09-20", dueTime: "18:00" });
    const untimed = makeTask({ dueDate: "2026-09-20" });
    const future = makeTask({ dueDate: "2026-09-25" });
    const result = selectToday([future, untimed, laterToday, earlyToday, late], clock);

    expect(result.overdue.map((t) => t.id)).toEqual([late.id, earlyToday.id]);
    expect(result.today.map((t) => t.id)).toEqual([untimed.id, laterToday.id]);
    expect(result.highPriority).toEqual([]);
  });

  it("reports progress as done versus due today", () => {
    const tasks = [
      makeTask({ dueDate: "2026-09-20", completed: true, completedAt: "2026-09-20T08:00:00.000Z" }),
      makeTask({ dueDate: "2026-09-20" }),
      makeTask({ dueDate: "2026-09-20" }),
      makeTask({ dueDate: "2026-09-21" }),
    ];
    expect(selectToday(tasks, clock).progress).toEqual({ done: 1, total: 3 });
  });

  it("high priority shows other active high-priority tasks", () => {
    const high = makeTask({ priority: "high", dueDate: "2026-10-01" });
    const highToday = makeTask({ priority: "high", dueDate: "2026-09-20", dueTime: "20:00" });
    const result = selectToday([high, highToday, makeTask({ priority: "high", completed: true })], clock);
    expect(result.highPriority).toEqual([high]);
    expect(result.today).toEqual([highToday]);
  });

  it("hides tasks that belong to archived projects", () => {
    const archived = makeProject({ archived: true });
    const hidden = makeTask({ projectId: archived.id, dueDate: "2026-09-20" });
    const shown = makeTask({ dueDate: "2026-09-20" });
    const ids = archivedProjectIds([archived, makeProject()]);
    expect(selectToday([hidden, shown], clock, ids).today).toEqual([shown]);
    expect(selectUpcoming([makeTask({ projectId: archived.id, dueDate: "2026-09-25" })], clock.today, ids)).toEqual([]);
  });

  it("upcoming groups active tasks after today by date", () => {
    const a = makeTask({ dueDate: "2026-09-22", dueTime: "09:00" });
    const b = makeTask({ dueDate: "2026-09-21" });
    const c = makeTask({ dueDate: "2026-09-22", dueTime: "08:00" });
    const groups = selectUpcoming(
      [a, b, c, makeTask({ dueDate: "2026-09-20" }), makeTask(), makeTask({ dueDate: "2026-09-30", completed: true })],
      clock.today,
    );
    expect(groups.map((g) => g.key)).toEqual(["2026-09-21", "2026-09-22"]);
    expect(groups[1].tasks.map((t) => t.id)).toEqual([c.id, a.id]);
  });

  it("completed lists newest first grouped by day", () => {
    const old = makeTask({ completed: true, completedAt: new Date(2026, 8, 10, 9).toISOString() });
    const recent = makeTask({ completed: true, completedAt: new Date(2026, 8, 19, 15).toISOString() });
    const recentEarlier = makeTask({ completed: true, completedAt: new Date(2026, 8, 19, 8).toISOString() });
    const groups = selectCompleted([old, recentEarlier, recent, makeTask()]);
    expect(groups.map((g) => g.key)).toEqual(["2026-09-19", "2026-09-10"]);
    expect(groups[0].tasks.map((t) => t.id)).toEqual([recent.id, recentEarlier.id]);
  });
});

describe("helpers", () => {
  it("isOverdue accounts for time of day", () => {
    expect(isOverdue(makeTask({ dueDate: "2026-09-19" }), clock)).toBe(true);
    expect(isOverdue(makeTask({ dueDate: "2026-09-20" }), clock)).toBe(false);
    expect(isOverdue(makeTask({ dueDate: "2026-09-20", dueTime: "09:59" }), clock)).toBe(true);
    expect(isOverdue(makeTask({ dueDate: "2026-09-20", dueTime: "10:00" }), clock)).toBe(false);
    expect(isOverdue(makeTask({ dueDate: "2026-09-19", completed: true }), clock)).toBe(false);
    expect(isOverdue(makeTask(), clock)).toBe(false);
  });

  it("computes project and subtask progress", () => {
    const tasks = [
      makeTask({ projectId: "p", completed: true }),
      makeTask({ projectId: "p" }),
      makeTask({ projectId: "other" }),
    ];
    expect(projectProgress(tasks, "p")).toEqual({ done: 1, total: 2 });
    const parent = makeTask({
      subtasks: [
        { id: "1", title: "a", completed: true },
        { id: "2", title: "b", completed: false },
      ],
    });
    expect(subtaskProgress(parent)).toEqual({ done: 1, total: 2 });
  });
});
