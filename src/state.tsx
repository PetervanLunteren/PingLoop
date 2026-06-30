// The single source of truth: a reducer over one timer, persisted to
// localStorage, plus one loop that fires a notification and sound when it
// finishes while the app is open.

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { TimerState } from "./types";
import { loadTimer, saveTimer } from "./storage";
import { isCatchUp, isFinished, markFinished, setDuration, start, stop } from "./timer";
import { showNotification } from "./notify";
import { playBeep, unlockAudio } from "./sound";
import { cancelBackground, scheduleBackground, type BackgroundAlert } from "./push";
import { pickSuggestion } from "./suggestions";

const HOUR_MS = 60 * 60 * 1000;
// A run keeps repeating for this long, then stops on its own.
const REPEAT_HOURS = 8;
// A finish detected more than this late was missed while the app slept, so the
// background push already handled it and the app should not alert again.
const CATCH_UP_MS = 3000;

/** Build the background alert for a timer ending at `fireAt`. */
function alertFor(
  timer: TimerState,
  fireAt: number,
  repeatUntil: number | null,
): BackgroundAlert {
  return {
    fireAt,
    title: "Time for a break",
    // The worker swaps in a fresh suggestion per background ping; this is a fallback.
    body: pickSuggestion(),
    // The timer always repeats; the server stops it once repeatUntil passes.
    repeat: true,
    intervalMs: timer.durationMs,
    repeatUntil,
  };
}

type Action =
  | { type: "select"; durationMs: number }
  | { type: "toggle"; now: number }
  | { type: "restart"; now: number }
  | { type: "finish" };

function reducer(timer: TimerState, action: Action): TimerState {
  switch (action.type) {
    case "select":
      return setDuration(timer, action.durationMs);
    case "toggle":
      if (timer.status === "running") return stop(timer);
      // The timer always repeats, bounded by the repeat window.
      return {
        ...start(timer, action.now),
        repeatUntil: action.now + REPEAT_HOURS * HOUR_MS,
      };
    case "restart":
      return start(timer, action.now);
    case "finish":
      return markFinished(timer);
  }
}

interface Store {
  timer: TimerState;
  /** Current time in epoch ms, refreshed every second for the live countdown. */
  now: number;
  selectInterval: (durationMs: number) => void;
  toggle: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [timer, dispatch] = useReducer(reducer, undefined, loadTimer);
  const [now, setNow] = useState(() => Date.now());

  // One global clock drives the countdown and the finish check.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Persist on every change. A running timer does not mutate state each second
  // (its countdown is derived), so this stays cheap.
  useEffect(() => {
    saveTimer(timer);
  }, [timer]);

  // The scheduler: when the running timer reaches zero, alert once and re-sync.
  useEffect(() => {
    if (isFinished(timer, now)) {
      // A finish detected well after the fact means the app was asleep and the
      // background push already alerted, so re-sync silently instead of firing a
      // duplicate. A live finish is caught within a tick (~1s).
      if (!isCatchUp(timer, now, CATCH_UP_MS)) {
        playBeep();
        void showNotification("Time for a break", pickSuggestion());
      }

      const continuing = timer.repeatUntil !== null && now < timer.repeatUntil;
      if (continuing) {
        dispatch({ type: "restart", now });
      } else {
        dispatch({ type: "finish" });
        // The repeat run is over (or it was a one-shot), so drop the background push.
        void cancelBackground();
      }
    }
  }, [now, timer]);

  const store: Store = {
    timer,
    now,
    selectInterval: (durationMs) => {
      const wasRunning = timer.status === "running";
      dispatch({ type: "select", durationMs });
      // Choosing a new length stops the timer, so drop any background alert.
      if (wasRunning) void cancelBackground();
    },
    toggle: () => {
      unlockAudio();
      // Use one timestamp for both the new end time and the display clock, so
      // the countdown starts exactly at the full interval with no lag jump.
      const ts = Date.now();
      setNow(ts);
      const wasRunning = timer.status === "running";
      dispatch({ type: "toggle", now: ts });
      if (wasRunning) {
        void cancelBackground();
      } else {
        const repeatUntil = ts + REPEAT_HOURS * HOUR_MS;
        void scheduleBackground(alertFor(timer, ts + timer.durationMs, repeatUntil));
      }
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (store === null) {
    throw new Error("useStore must be used inside a StoreProvider");
  }
  return store;
}
