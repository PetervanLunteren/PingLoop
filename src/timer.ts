// Pure timer-state transitions. No React, no global clock: callers pass `now`
// (epoch ms) so every function is deterministic and unit-testable.

import type { TimerState } from "./types";

/** Turn the timer on, counting down from the selected interval. */
export function start(timer: TimerState, now: number): TimerState {
  return { ...timer, status: "running", endsAt: now + timer.durationMs };
}

/** Turn the timer off and return it to the full interval, ready to start. */
export function stop(timer: TimerState): TimerState {
  return { ...timer, status: "idle", endsAt: null };
}

/** Choose a new interval. This also turns the timer off. */
export function setDuration(timer: TimerState, durationMs: number): TimerState {
  return { ...timer, durationMs, status: "idle", endsAt: null };
}

/** Mark the timer finished. Used when it reaches zero. */
export function markFinished(timer: TimerState): TimerState {
  return { ...timer, status: "finished", endsAt: null };
}

/** Milliseconds left right now, derived from `endsAt` while running. */
export function remainingAt(timer: TimerState, now: number): number {
  if (timer.status === "running" && timer.endsAt !== null) {
    return Math.max(0, timer.endsAt - now);
  }
  if (timer.status === "finished") return 0;
  return timer.durationMs;
}

/** True when a running timer has reached or passed its end. */
export function isFinished(timer: TimerState, now: number): boolean {
  return (
    timer.status === "running" &&
    timer.endsAt !== null &&
    now >= timer.endsAt
  );
}
