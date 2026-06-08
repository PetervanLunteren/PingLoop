// localStorage persistence. Following the repo conventions we crash loudly on
// corrupt or unexpected data rather than silently resetting it: a real problem
// should be visible, not hidden. A first run with no saved data is normal and
// returns empty state.

import type { AppState } from "./types";

const STORAGE_KEY = "pingloop:v1";

export function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return { timers: [], reminders: [], pings: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`PingLoop saved data could not be parsed: ${String(err)}`);
  }

  if (!isAppState(parsed)) {
    throw new Error("PingLoop saved data has an unexpected shape");
  }
  return parsed;
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Wipe saved data. Used by the error screen to recover from bad data. */
export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function isAppState(value: unknown): value is AppState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.timers) &&
    Array.isArray(v.reminders) &&
    Array.isArray(v.pings)
  );
}
