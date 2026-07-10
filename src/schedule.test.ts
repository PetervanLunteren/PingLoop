import { describe, expect, it } from "vitest";
import { isRunning, nextPingAt, remainingMs } from "./schedule";
import type { Schedule } from "./types";

const MINUTE = 60_000;
const FIRE_AT = 1_000_000;
const INTERVAL = 30 * MINUTE;

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    fireAt: FIRE_AT,
    intervalMs: INTERVAL,
    until: FIRE_AT + 8 * 60 * MINUTE,
    ...overrides,
  };
}

describe("nextPingAt", () => {
  it("returns the first slot before it arrives", () => {
    expect(nextPingAt(FIRE_AT, INTERVAL, FIRE_AT - 1)).toBe(FIRE_AT);
  });

  it("rolls to the next slot exactly at a slot", () => {
    expect(nextPingAt(FIRE_AT, INTERVAL, FIRE_AT)).toBe(FIRE_AT + INTERVAL);
  });

  it("returns the upcoming slot mid-interval", () => {
    expect(nextPingAt(FIRE_AT, INTERVAL, FIRE_AT + MINUTE)).toBe(FIRE_AT + INTERVAL);
  });

  it("skips whole intervals when the app was closed for hours", () => {
    const now = FIRE_AT + 3 * INTERVAL + MINUTE;
    expect(nextPingAt(FIRE_AT, INTERVAL, now)).toBe(FIRE_AT + 4 * INTERVAL);
  });

  it("always lands on the grid the worker walks", () => {
    const next = nextPingAt(FIRE_AT, INTERVAL, FIRE_AT + 7 * INTERVAL + 123);
    expect((next - FIRE_AT) % INTERVAL).toBe(0);
  });
});

describe("isRunning", () => {
  it("is false without a schedule", () => {
    expect(isRunning(null, FIRE_AT)).toBe(false);
  });

  it("is true before the run ends", () => {
    const s = makeSchedule();
    expect(isRunning(s, s.until - 1)).toBe(true);
  });

  it("is false once the run ends", () => {
    const s = makeSchedule();
    expect(isRunning(s, s.until)).toBe(false);
  });
});

describe("remainingMs", () => {
  it("falls back to the idle interval with no run", () => {
    expect(remainingMs(null, FIRE_AT, INTERVAL)).toBe(INTERVAL);
  });

  it("counts down to the next ping while running", () => {
    expect(remainingMs(makeSchedule(), FIRE_AT - MINUTE, INTERVAL)).toBe(MINUTE);
  });

  it("falls back to the idle interval once the run is over", () => {
    const s = makeSchedule();
    expect(remainingMs(s, s.until + 1, INTERVAL)).toBe(INTERVAL);
  });
});
