// Small, pure display and parsing helpers shared by the UI.

import type { Weekday } from "./types";

/** Weekday order starting on Monday, for display and the day picker. */
export const WEEKDAYS_MON_FIRST: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

const SHORT_DAY: Record<Weekday, string> = {
  0: "Su",
  1: "Mo",
  2: "Tu",
  3: "We",
  4: "Th",
  5: "Fr",
  6: "Sa",
};

export function weekdayShort(day: Weekday): string {
  return SHORT_DAY[day];
}

/** Human summary of active days: "Every day", "Weekdays", or a short list. */
export function summarizeDays(days: Weekday[]): string {
  const set = new Set(days);
  if (set.size === 0) return "No days";
  if (set.size === 7) return "Every day";
  if (set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d as Weekday))) {
    return "Weekdays";
  }
  if (set.size === 2 && set.has(0) && set.has(6)) return "Weekends";
  return WEEKDAYS_MON_FIRST.filter((d) => set.has(d)).map(weekdayShort).join(", ");
}

/** Countdown text from milliseconds: "M:SS" or "H:MM:SS". Rounds seconds up. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${minutes}:${ss}`;
}

/** "HH:MM" (24h) from minutes since local midnight. */
export function minutesToTimeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Minutes since midnight from an <input type="time"> "HH:MM" value. */
export function timeLabelToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) {
    throw new Error(`invalid time value: "${value}"`);
  }
  return h * 60 + m;
}

/** Friendly local date and time for a reminder or next ping. */
export function formatDateTime(epoch: number): string {
  return new Date(epoch).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Just the local time, used for the "next ping" hint. */
export function formatTime(epoch: number): string {
  return new Date(epoch).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
