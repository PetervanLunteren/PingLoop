// Core data model for PingLoop. Three independent concepts, kept deliberately
// flat so they are trivial to serialise to localStorage and reason about.

export type ID = string;

/** 0 = Sunday ... 6 = Saturday, matching Date.getDay(). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type TimerStatus = "idle" | "running" | "paused" | "finished";

/**
 * A countdown timer. Time is tracked with an absolute `endsAt` while running so
 * the countdown stays correct across reloads and tab sleeps. While idle or
 * paused we instead hold the frozen `remainingMs`.
 */
export interface Timer {
  id: ID;
  label: string;
  durationMs: number;
  remainingMs: number;
  endsAt: number | null;
  status: TimerStatus;
}

/** A one-time reminder that fires once at an absolute moment. */
export interface Reminder {
  id: ID;
  title: string;
  dueAt: number;
  fired: boolean;
}

/**
 * A recurring ping: fires every `intervalMinutes` within a daily time window on
 * the chosen weekdays. `lastFiredAt` records the slot we last fired so we never
 * fire the same slot twice, even across reloads.
 */
export interface RecurringPing {
  id: ID;
  title: string;
  intervalMinutes: number;
  startMinutes: number;
  endMinutes: number;
  activeDays: Weekday[];
  enabled: boolean;
  lastFiredAt: number | null;
}

/** The full persisted application state. */
export interface AppState {
  timers: Timer[];
  reminders: Reminder[];
  pings: RecurringPing[];
}
