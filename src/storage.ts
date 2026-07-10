// The only thing worth keeping on the device: which interval you last picked.
// The run itself lives on the worker, so there is nothing else to persist.
// Following the repo conventions we crash loudly on corrupt data rather than
// silently resetting it.

const STORAGE_KEY = "pingloop:pref:v1";

export const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;

export function loadIntervalPref(): number {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return DEFAULT_INTERVAL_MS;

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`PingLoop saved interval is not a positive number: "${raw}"`);
  }
  return value;
}

export function saveIntervalPref(intervalMs: number): void {
  localStorage.setItem(STORAGE_KEY, String(intervalMs));
}

/** Wipe saved data. Used by the error screen to recover from bad data. */
export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
