// A single Kubus-style countdown timer: pick an interval, toggle it on and off.

export type TimerStatus = "idle" | "running" | "finished";

/**
 * The whole app state. `durationMs` is the selected interval (and doubles as the
 * last-used default, since it is persisted). While running, `endsAt` is the
 * absolute finish time so the countdown survives a reload.
 */
export interface TimerState {
  durationMs: number;
  endsAt: number | null;
  status: TimerStatus;
  /** When true, the timer restarts itself right after it pings. */
  repeat: boolean;
}
