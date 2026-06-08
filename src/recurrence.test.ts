import { describe, expect, it } from "vitest";
import { dueSlot, nextPingAt, slotsForLocalDay, startOfLocalDay } from "./recurrence";
import type { RecurringPing } from "./types";

// All times are built with the local Date constructor and compared against
// function output that also uses local time, so these tests pass in any zone.
// 2024-01-01 is a Monday (getDay() === 1).
function at(month: number, day: number, hour: number, minute: number): number {
  return new Date(2024, month, day, hour, minute, 0, 0).getTime();
}

function makePing(overrides: Partial<RecurringPing> = {}): RecurringPing {
  return {
    id: "p1",
    title: "Stretch",
    intervalMinutes: 60,
    startMinutes: 9 * 60,
    endMinutes: 17 * 60,
    activeDays: [1, 2, 3, 4, 5],
    enabled: true,
    lastFiredAt: null,
    ...overrides,
  };
}

describe("slotsForLocalDay", () => {
  it("lists inclusive slots on an active day", () => {
    const slots = slotsForLocalDay(makePing(), startOfLocalDay(at(0, 1, 0, 0)));
    expect(slots).toHaveLength(9); // 09:00 .. 17:00 by the hour
    expect(slots[0]).toBe(at(0, 1, 9, 0));
    expect(slots[slots.length - 1]).toBe(at(0, 1, 17, 0));
  });

  it("is empty on an inactive day", () => {
    // 2024-01-06 is a Saturday.
    const slots = slotsForLocalDay(makePing(), startOfLocalDay(at(0, 6, 0, 0)));
    expect(slots).toEqual([]);
  });

  it("stops at the last slot inside the window when interval does not divide it", () => {
    const ping = makePing({ startMinutes: 540, endMinutes: 600, intervalMinutes: 25 });
    const slots = slotsForLocalDay(ping, startOfLocalDay(at(0, 1, 0, 0)));
    expect(slots).toEqual([at(0, 1, 9, 0), at(0, 1, 9, 25), at(0, 1, 9, 50)]);
  });

  it("throws on invalid configuration", () => {
    expect(() => slotsForLocalDay(makePing({ intervalMinutes: 0 }), 0)).toThrow();
    expect(() =>
      slotsForLocalDay(makePing({ startMinutes: 600, endMinutes: 540 }), 0),
    ).toThrow();
  });
});

describe("dueSlot", () => {
  it("returns the most recent slot at or before now", () => {
    expect(dueSlot(makePing(), at(0, 1, 14, 30))).toBe(at(0, 1, 14, 0));
  });

  it("returns null before the window opens", () => {
    expect(dueSlot(makePing(), at(0, 1, 8, 0))).toBeNull();
  });

  it("returns the final slot after the window closes", () => {
    expect(dueSlot(makePing(), at(0, 1, 20, 0))).toBe(at(0, 1, 17, 0));
  });

  it("returns null when disabled", () => {
    expect(dueSlot(makePing({ enabled: false }), at(0, 1, 14, 30))).toBeNull();
  });
});

describe("nextPingAt", () => {
  it("finds the next slot later the same day", () => {
    expect(nextPingAt(makePing(), at(0, 1, 14, 30))).toBe(at(0, 1, 15, 0));
  });

  it("rolls to the next active day after the window", () => {
    expect(nextPingAt(makePing(), at(0, 1, 17, 30))).toBe(at(0, 2, 9, 0));
  });

  it("skips inactive days", () => {
    // Friday 2024-01-05 evening rolls to Monday 2024-01-08.
    expect(nextPingAt(makePing(), at(0, 5, 17, 30))).toBe(at(0, 8, 9, 0));
  });

  it("returns null when disabled or no days are active", () => {
    expect(nextPingAt(makePing({ enabled: false }), at(0, 1, 9, 0))).toBeNull();
    expect(nextPingAt(makePing({ activeDays: [] }), at(0, 1, 9, 0))).toBeNull();
  });
});
