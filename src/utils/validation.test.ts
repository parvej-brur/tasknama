import { describe, expect, it } from "@jest/globals";

import { validateName } from "./validation";

describe("validateName", () => {
  const existing = [{ id: "1", name: "Work" }];
  it("requires a name", () => expect(validateName("  ", existing)).toBe("Name is required."));
  it("is unique ignoring case", () => {
    expect(validateName("work", existing)).toBe("That name is already taken.");
    expect(validateName(" WORK ", existing)).toBe("That name is already taken.");
    expect(validateName("Work", existing, "1")).toBeNull();
    expect(validateName("Home", existing)).toBeNull();
  });
});
