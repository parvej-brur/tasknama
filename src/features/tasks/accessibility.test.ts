import { describe, expect, it } from "@jest/globals";

import { makeTask } from "@/testing/factories";

import { taskA11yLabel } from "./accessibility";

const today = "2026-09-20";

describe("taskA11yLabel", () => {
  it("reads title, priority, due date and status", () => {
    const task = makeTask({ title: "Buy milk", priority: "high", dueDate: "2026-09-20", dueTime: "17:00" });
    expect(taskA11yLabel(task, today, false)).toBe("Buy milk, high priority, due today 5 PM, not completed");
  });

  it("omits the due segment when there is no date and reports completion", () => {
    const task = makeTask({ title: "Read", priority: "low", completed: true, completedAt: "2026-09-19T10:00:00.000Z" });
    expect(taskA11yLabel(task, today, false)).toBe("Read, low priority, completed");
  });

  it("adds overdue and subtask progress after the status", () => {
    const task = makeTask({
      title: "Report",
      dueDate: "2026-09-18",
      subtasks: [
        { id: "1", title: "a", completed: true },
        { id: "2", title: "b", completed: false },
      ],
    });
    expect(taskA11yLabel(task, today, true)).toBe(
      "Report, medium priority, due Fri, Sep 18, not completed, overdue, 1 of 2 subtasks done",
    );
  });
});
