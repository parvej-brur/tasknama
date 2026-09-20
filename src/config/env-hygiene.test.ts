import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// This repository is public. Real Supabase values belong in a local, git-ignored
// .env; these checks keep it that way.

const root = join(__dirname, "..", "..");
const read = (file: string) => readFileSync(join(root, file), "utf8");

describe("credential hygiene", () => {
  it("git-ignores every .env file except .env.example", () => {
    const lines = read(".gitignore")
      .split("\n")
      .map((line) => line.trim());
    expect(lines).toContain(".env");
    expect(lines).toContain(".env.*");
    expect(lines).toContain("!.env.example");
    // The negation only works if it comes after the pattern it re-includes.
    expect(lines.indexOf("!.env.example")).toBeGreaterThan(lines.indexOf(".env.*"));
  });

  it("keeps only placeholders in .env.example", () => {
    const values = read(".env.example")
      .split("\n")
      .filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => line.slice(line.indexOf("=") + 1).trim());

    expect(values).toHaveLength(2);
    for (const value of values) expect(value).toMatch(/your-project-ref|your-anon-key/);
  });
});
