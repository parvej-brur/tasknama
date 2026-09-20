import { describe, expect, it } from "@jest/globals";

import {
  isLive,
  pauseSession,
  reconcileSession,
  remainingMs,
  resumeSession,
  startSession,
  stopSession,
} from "./session";

const MIN = 60_000;

describe("focus session", () => {
  it("remaining time comes from the end timestamp", () => {
    const s = startSession("f", "t", 25 * MIN, 1_000_000);
    expect(s.endsAt).toBe(1_000_000 + 25 * MIN);
    expect(remainingMs(s, 1_000_000)).toBe(25 * MIN);
    expect(remainingMs(s, 1_000_000 + 10 * MIN)).toBe(15 * MIN);
    expect(remainingMs(s, 1_000_000 + 99 * MIN)).toBe(0);
  });

  it("pause freezes the remaining time and resume sets a new end timestamp", () => {
    const running = startSession("f", "t", 25 * MIN, 0);
    const paused = pauseSession(running, 10 * MIN);
    expect(paused).toMatchObject({ status: "paused", endsAt: null, remainingMs: 15 * MIN });
    // Time spent paused doesn't count.
    expect(remainingMs(paused, 500 * MIN)).toBe(15 * MIN);
    const resumed = resumeSession(paused, 500 * MIN);
    expect(resumed).toMatchObject({ status: "running", endsAt: 515 * MIN, remainingMs: null });
  });

  it("stop ends the session without counting it as completed", () => {
    const stopped = stopSession(startSession("f", "t", MIN, 0), 1000);
    expect(stopped.status).toBe("stopped");
    expect(isLive(stopped)).toBe(false);
  });

  it("reopening after the end time marks the session completed at its end time", () => {
    const s = startSession("f", "t", 25 * MIN, 0);
    expect(reconcileSession(s, 24 * MIN)).toBe(s);
    const done = reconcileSession(s, 60 * MIN);
    expect(done.status).toBe("completed");
    expect(done.finishedAt).toBe(new Date(25 * MIN).toISOString());
    // Paused sessions never complete on their own.
    const paused = pauseSession(s, MIN);
    expect(reconcileSession(paused, 999 * MIN)).toBe(paused);
  });
});
