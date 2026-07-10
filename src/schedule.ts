// Pure maths over a run. No React, no clock of its own: callers pass `now`, so
// every function is deterministic and unit-testable.
//
// The worker walks the same grid (`fireAt + k * intervalMs`), so the countdown
// the app draws and the ping the worker sends cannot drift apart. That is why
// nothing here has to be re-synced with the server.

import type { Schedule } from "./types";

/** The next ping on the grid, at or after `now`. */
export function nextPingAt(fireAt: number, intervalMs: number, now: number): number {
  if (now < fireAt) return fireAt;
  const steps = Math.floor((now - fireAt) / intervalMs) + 1;
  return fireAt + steps * intervalMs;
}

/** A run is on until its end time passes. There is no "finished" state. */
export function isRunning(schedule: Schedule | null, now: number): boolean {
  return schedule !== null && now < schedule.until;
}

/** Milliseconds until the next ping, or the full interval when nothing runs. */
export function remainingMs(schedule: Schedule | null, now: number, idleMs: number): number {
  if (schedule === null || now >= schedule.until) return idleMs;
  return nextPingAt(schedule.fireAt, schedule.intervalMs, now) - now;
}
