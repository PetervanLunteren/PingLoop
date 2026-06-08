import { describe, expect, it } from "vitest";
import {
  isFinished,
  markFinished,
  pause,
  remainingAt,
  reset,
  start,
} from "./timer";
import type { Timer } from "./types";

const DURATION = 25 * 60 * 1000;

function makeTimer(overrides: Partial<Timer> = {}): Timer {
  return {
    id: "t1",
    label: "Study",
    durationMs: DURATION,
    remainingMs: DURATION,
    endsAt: null,
    status: "idle",
    ...overrides,
  };
}

describe("start", () => {
  it("runs from the remaining time using an absolute end", () => {
    const t = start(makeTimer(), 1000);
    expect(t.status).toBe("running");
    expect(t.endsAt).toBe(1000 + DURATION);
  });

  it("is a no-op when already running", () => {
    const running = start(makeTimer(), 1000);
    expect(start(running, 5000)).toBe(running);
  });

  it("resumes a paused timer from what was left", () => {
    const paused = makeTimer({ status: "paused", remainingMs: 60_000 });
    const t = start(paused, 2000);
    expect(t.endsAt).toBe(2000 + 60_000);
  });
});

describe("pause", () => {
  it("freezes the remaining time", () => {
    const running = start(makeTimer(), 0);
    const paused = pause(running, 60_000);
    expect(paused.status).toBe("paused");
    expect(paused.remainingMs).toBe(DURATION - 60_000);
    expect(paused.endsAt).toBeNull();
  });

  it("is a no-op when not running", () => {
    const idle = makeTimer();
    expect(pause(idle, 1000)).toBe(idle);
  });
});

describe("reset", () => {
  it("restores the full duration and goes idle", () => {
    const t = reset(makeTimer({ status: "finished", remainingMs: 0 }));
    expect(t.status).toBe("idle");
    expect(t.remainingMs).toBe(DURATION);
    expect(t.endsAt).toBeNull();
  });
});

describe("remainingAt", () => {
  it("derives from endsAt while running and clamps at zero", () => {
    const running = start(makeTimer(), 0);
    expect(remainingAt(running, 60_000)).toBe(DURATION - 60_000);
    expect(remainingAt(running, DURATION + 5000)).toBe(0);
  });

  it("returns the frozen remainder when paused", () => {
    const paused = makeTimer({ status: "paused", remainingMs: 12_000 });
    expect(remainingAt(paused, 999_999)).toBe(12_000);
  });
});

describe("isFinished", () => {
  it("is true only once a running timer reaches its end", () => {
    const running = start(makeTimer(), 0);
    expect(isFinished(running, DURATION - 1)).toBe(false);
    expect(isFinished(running, DURATION)).toBe(true);
  });

  it("is false for idle or paused timers", () => {
    expect(isFinished(makeTimer(), 10 ** 12)).toBe(false);
    expect(isFinished(markFinished(makeTimer()), 10 ** 12)).toBe(false);
  });
});
