import { describe, expect, it } from "@jest/globals";

import { parseQuickAdd } from "./quick-add";

// Sunday 2026-09-20, 10:00 local.
const now = new Date(2026, 8, 20, 10, 0);
const tags = [{ id: "tag-career", name: "Career" }];

const parse = (input: string, disabled?: Parameters<typeof parseQuickAdd>[1]["disabled"]) =>
  parseQuickAdd(input, { now, existingTags: tags, disabled });

describe("parseQuickAdd", () => {
  it("handles the reference example", () => {
    const result = parse(
      "Prepare React Native interview presentation tomorrow at 7 PM, high priority #career",
    );
    expect(result).toMatchObject({
      title: "Prepare React Native interview presentation",
      dueDate: "2026-09-21",
      dueTime: "19:00",
      priority: "high",
      recurrence: null,
    });
    expect(result.tags).toEqual([{ name: "Career", existingId: "tag-career" }]);
  });

  it("returns just a title for plain text", () => {
    expect(parse("Buy milk")).toEqual({
      title: "Buy milk",
      dueDate: null,
      dueTime: null,
      priority: null,
      tags: [],
      recurrence: null,
    });
  });

  it.each([
    ["Pay rent high priority", "high"],
    ["Pay rent medium priority", "medium"],
    ["Pay rent low priority", "low"],
    ["Pay rent p1", "high"],
    ["Pay rent p2", "medium"],
    ["Pay rent p3", "low"],
    ["Pay rent urgent", "high"],
    ["Pay rent !high", "high"],
    ["Pay rent !low", "low"],
  ])("reads priority from %s", (input, priority) => {
    const result = parse(input);
    expect(result.priority).toBe(priority);
    expect(result.title).toBe("Pay rent");
  });

  it("marks unknown tags as new and keeps known ones matched", () => {
    const result = parse("Ship it #release #CAREER");
    expect(result.title).toBe("Ship it");
    expect(result.tags).toEqual([
      { name: "release", existingId: null },
      { name: "Career", existingId: "tag-career" },
    ]);
  });

  it("removes matched words from the title", () => {
    expect(parse("Call Sam on Friday").title).toBe("Call Sam");
  });

  it("a time with no date is today when still ahead", () => {
    const result = parse("Stand-up at 5pm");
    expect(result).toMatchObject({ dueDate: "2026-09-20", dueTime: "17:00", title: "Stand-up" });
  });

  it("a time with no date is tomorrow when already past", () => {
    expect(parse("Breakfast at 8am")).toMatchObject({ dueDate: "2026-09-21", dueTime: "08:00" });
  });

  it("prefers future dates", () => {
    // Saturday is 6 days away, not the one that just passed.
    expect(parse("Clean garage on Saturday").dueDate).toBe("2026-09-26");
  });

  it("parses recurrence phrases", () => {
    expect(parse("Water plants every day")).toMatchObject({
      title: "Water plants",
      recurrence: { kind: "daily" },
      dueDate: "2026-09-20",
    });
    expect(parse("Team sync every Monday at 9am")).toMatchObject({
      title: "Team sync",
      recurrence: { kind: "weekly", weekdays: [1] },
      dueDate: "2026-09-21",
      dueTime: "09:00",
    });
    const monthly = parse("Pay rent every month");
    expect(monthly.recurrence).toEqual({ kind: "monthly", dayOfMonth: 20 });
    expect(monthly.title).toBe("Pay rent");
    expect(parse("Stretch every 3 days").recurrence).toEqual({ kind: "custom", interval: 3, unit: "day" });
  });

  it("never crashes and falls back to the raw title", () => {
    for (const input of ["", "   ", "#", "!!!", "every", "at at at", "😀 #😀", "a".repeat(500)]) {
      expect(() => parse(input)).not.toThrow();
    }
    expect(parse("").title).toBe("");
    expect(parse("a".repeat(500)).title).toHaveLength(200);
  });

  it("a disabled part stays in the title", () => {
    const result = parse("Send report tomorrow p1", new Set(["date", "priority"] as const));
    expect(result.dueDate).toBeNull();
    expect(result.priority).toBeNull();
    expect(result.title).toBe("Send report tomorrow p1");
  });

  it("a disabled tag stays in the title", () => {
    const result = parse("Plan #trip #fun", new Set(["tag:fun"] as const));
    expect(result.tags.map((t) => t.name)).toEqual(["trip"]);
    expect(result.title).toBe("Plan #fun");
  });
});
