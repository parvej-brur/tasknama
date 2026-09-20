import { describe, expect, it } from "@jest/globals";

import { parseDraftParam } from "./draft";

describe("parseDraftParam", () => {
  it("reads a well-formed draft", () => {
    const draft = parseDraftParam(
      JSON.stringify({
        title: "Prep",
        priority: "high",
        dueDate: "2026-09-21",
        dueTime: "19:00",
        tagIds: ["a", 3],
        recurrence: { kind: "daily" },
      }),
    );
    expect(draft).toEqual({
      title: "Prep",
      priority: "high",
      dueDate: "2026-09-21",
      dueTime: "19:00",
      tagIds: ["a"],
      recurrence: { kind: "daily" },
    });
  });

  it("ignores junk, and time or repeat without a valid date", () => {
    expect(parseDraftParam(undefined)).toEqual({});
    expect(parseDraftParam("{nope")).toEqual({});
    expect(parseDraftParam("[1,2]")).toEqual({});
    expect(parseDraftParam(JSON.stringify({ priority: "urgent", dueDate: "2026-13-40", dueTime: "10:00" }))).toEqual({});
  });
});
