import { describe, expect, it } from "vitest";
import {
  isFinished,
  markFinished,
  remainingAt,
  setDuration,
  start,
  stop,
} from "./timer";
import type { TimerState } from "./types";

const THIRTY_MIN = 30 * 60 * 1000;

function makeTimer(overrides: Partial<TimerState> = {}): TimerState {
  return { durationMs: THIRTY_MIN, endsAt: null, status: "idle", ...overrides };
}

describe("start", () => {
  it("runs from the full interval using an absolute end", () => {
    const t = start(makeTimer(), 1000);
    expect(t.status).toBe("running");
    expect(t.endsAt).toBe(1000 + THIRTY_MIN);
  });
});

describe("stop", () => {
  it("turns the timer off and clears the end", () => {
    const running = start(makeTimer(), 0);
    const stopped = stop(running);
    expect(stopped.status).toBe("idle");
    expect(stopped.endsAt).toBeNull();
  });
});

describe("setDuration", () => {
  it("changes the interval and turns the timer off", () => {
    const running = start(makeTimer(), 0);
    const next = setDuration(running, 5 * 60 * 1000);
    expect(next.durationMs).toBe(5 * 60 * 1000);
    expect(next.status).toBe("idle");
    expect(next.endsAt).toBeNull();
  });
});

describe("remainingAt", () => {
  it("derives from endsAt while running and clamps at zero", () => {
    const running = start(makeTimer(), 0);
    expect(remainingAt(running, 60_000)).toBe(THIRTY_MIN - 60_000);
    expect(remainingAt(running, THIRTY_MIN + 5000)).toBe(0);
  });

  it("returns the full interval while idle and zero when finished", () => {
    expect(remainingAt(makeTimer(), 999_999)).toBe(THIRTY_MIN);
    expect(remainingAt(markFinished(makeTimer()), 999_999)).toBe(0);
  });

  it("never exceeds the duration when the display clock lags the start", () => {
    // Started at t=1000, but the display clock is still at t=500 (stale).
    const running = start(makeTimer(), 1000);
    expect(remainingAt(running, 500)).toBe(THIRTY_MIN);
  });
});

describe("isFinished", () => {
  it("is true only once a running timer reaches its end", () => {
    const running = start(makeTimer(), 0);
    expect(isFinished(running, THIRTY_MIN - 1)).toBe(false);
    expect(isFinished(running, THIRTY_MIN)).toBe(true);
  });

  it("is false for idle or finished timers", () => {
    expect(isFinished(makeTimer(), 10 ** 12)).toBe(false);
    expect(isFinished(markFinished(makeTimer()), 10 ** 12)).toBe(false);
  });
});
