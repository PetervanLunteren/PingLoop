// Pure scheduling math for recurring pings. Everything works in the device's
// local time and takes `now`/`from` as epoch ms, so it is deterministic and
// unit-testable. We deliberately do not handle timezone travel or model DST
// precisely (see the non-goals in the README).

import type { RecurringPing, Weekday } from "./types";

const MINUTE_MS = 60_000;

/** Local midnight (epoch ms) for the day containing `epoch`. */
export function startOfLocalDay(epoch: number): number {
  const d = new Date(epoch);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function assertValid(ping: RecurringPing): void {
  if (ping.intervalMinutes <= 0) {
    throw new Error(`ping ${ping.id} has non-positive intervalMinutes`);
  }
  if (ping.endMinutes < ping.startMinutes) {
    throw new Error(`ping ${ping.id} has endMinutes before startMinutes`);
  }
}

/**
 * Slot times (epoch ms) for one local day, given that day's local midnight.
 * Empty when the weekday is not active. Slots run from `startMinutes` to
 * `endMinutes` inclusive, stepping by `intervalMinutes`.
 */
export function slotsForLocalDay(
  ping: RecurringPing,
  dayStartEpoch: number,
): number[] {
  assertValid(ping);
  const weekday = new Date(dayStartEpoch).getDay() as Weekday;
  if (!ping.activeDays.includes(weekday)) return [];

  const slots: number[] = [];
  for (let m = ping.startMinutes; m <= ping.endMinutes; m += ping.intervalMinutes) {
    slots.push(dayStartEpoch + m * MINUTE_MS);
  }
  return slots;
}

/**
 * The next slot strictly after `from`, or null when the ping is disabled or has
 * no active days. Scans forward up to 8 days, which always covers the next
 * active weekday.
 */
export function nextPingAt(ping: RecurringPing, from: number): number | null {
  if (!ping.enabled || ping.activeDays.length === 0) return null;

  let dayStart = startOfLocalDay(from);
  for (let day = 0; day < 8; day++) {
    const slot = slotsForLocalDay(ping, dayStart).find((s) => s > from);
    if (slot !== undefined) return slot;
    dayStart = startOfLocalDay(dayStart + 25 * 60 * MINUTE_MS); // next local day
  }
  return null;
}

/**
 * The most recent slot at or before `now` within today's active window, or null
 * if there is none (or the ping is disabled). Callers compare this against the
 * ping's `lastFiredAt` to fire each slot at most once, including a single
 * catch-up for a slot missed earlier today while the app was closed.
 */
export function dueSlot(ping: RecurringPing, now: number): number | null {
  if (!ping.enabled) return null;

  const slots = slotsForLocalDay(ping, startOfLocalDay(now)).filter(
    (s) => s <= now,
  );
  if (slots.length === 0) return null;
  return slots[slots.length - 1] ?? null;
}
