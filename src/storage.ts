// localStorage persistence for the single timer. Following the repo conventions
// we crash loudly on corrupt data rather than silently resetting it. A first run
// with no saved data returns the default interval.

import type { TimerState } from "./types";

const STORAGE_KEY = "pingloop:timer:v1";

const DEFAULT_DURATION_MS = 30 * 60 * 1000;

export function loadTimer(): TimerState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return { durationMs: DEFAULT_DURATION_MS, endsAt: null, status: "idle" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`PingLoop saved data could not be parsed: ${String(err)}`);
  }

  if (!isTimerState(parsed)) {
    throw new Error("PingLoop saved data has an unexpected shape");
  }
  return parsed;
}

export function saveTimer(timer: TimerState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
}

/** Wipe saved data. Used by the error screen to recover from bad data. */
export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function isTimerState(value: unknown): value is TimerState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.durationMs === "number" &&
    (typeof v.endsAt === "number" || v.endsAt === null) &&
    (v.status === "idle" || v.status === "running" || v.status === "finished")
  );
}
