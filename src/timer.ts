// Pure timer-state transitions. No React, no global clock: callers pass `now`
// (epoch ms) so every function is deterministic and unit-testable.

import type { Timer } from "./types";

/** Start a fresh or reset timer running from its full remaining time. */
export function start(timer: Timer, now: number): Timer {
  if (timer.status === "running") return timer;
  return {
    ...timer,
    status: "running",
    endsAt: now + timer.remainingMs,
  };
}

/** Freeze a running timer, keeping the time that is left. */
export function pause(timer: Timer, now: number): Timer {
  if (timer.status !== "running" || timer.endsAt === null) return timer;
  return {
    ...timer,
    status: "paused",
    remainingMs: Math.max(0, timer.endsAt - now),
    endsAt: null,
  };
}

/** Return a timer to its configured duration, ready to start again. */
export function reset(timer: Timer): Timer {
  return {
    ...timer,
    status: "idle",
    remainingMs: timer.durationMs,
    endsAt: null,
  };
}

/** Mark a timer finished. Used when it reaches zero. */
export function markFinished(timer: Timer): Timer {
  return {
    ...timer,
    status: "finished",
    remainingMs: 0,
    endsAt: null,
  };
}

/** Milliseconds left right now, derived from `endsAt` while running. */
export function remainingAt(timer: Timer, now: number): number {
  if (timer.status === "running" && timer.endsAt !== null) {
    return Math.max(0, timer.endsAt - now);
  }
  return timer.remainingMs;
}

/** True when a running timer has reached or passed its end. */
export function isFinished(timer: Timer, now: number): boolean {
  return (
    timer.status === "running" &&
    timer.endsAt !== null &&
    now >= timer.endsAt
  );
}
