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
import { isFinished, markFinished, setDuration, start, stop } from "./timer";
import { showNotification } from "./notify";
import { playBeep, unlockAudio } from "./sound";
import { cancelBackground, scheduleBackground, type BackgroundAlert } from "./push";
import { pickSuggestion } from "./suggestions";

const HOUR_MS = 60 * 60 * 1000;

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
    repeat: timer.repeat,
    intervalMs: timer.durationMs,
    repeatUntil,
  };
}

type Action =
  | { type: "select"; durationMs: number }
  | { type: "toggle"; now: number }
  | { type: "setRepeat"; repeat: boolean; now: number }
  | { type: "setRepeatHours"; hours: number }
  | { type: "restart"; now: number }
  | { type: "finish" };

function reducer(timer: TimerState, action: Action): TimerState {
  switch (action.type) {
    case "select":
      return setDuration(timer, action.durationMs);
    case "toggle":
      if (timer.status === "running") return stop(timer);
      return {
        ...start(timer, action.now),
        repeatUntil: timer.repeat ? action.now + timer.repeatHours * HOUR_MS : null,
      };
    case "setRepeat": {
      const next: TimerState = { ...timer, repeat: action.repeat };
      // A change mid-run sets or clears the session end immediately.
      if (timer.status === "running") {
        next.repeatUntil = action.repeat
          ? action.now + timer.repeatHours * HOUR_MS
          : null;
      }
      return next;
    }
    case "setRepeatHours":
      return { ...timer, repeatHours: action.hours };
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
  setRepeat: (repeat: boolean) => void;
  setRepeatHours: (hours: number) => void;
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

  // The scheduler: when the running timer reaches zero, mark it finished and
  // raise one notification plus one sound. Marking state prevents a re-fire.
  useEffect(() => {
    if (isFinished(timer, now)) {
      playBeep();
      const continuing =
        timer.repeat && timer.repeatUntil !== null && now < timer.repeatUntil;
      if (continuing) {
        void showNotification("Time for a break", pickSuggestion());
        dispatch({ type: "restart", now });
      } else {
        void showNotification("Time for a break", pickSuggestion());
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
        const repeatUntil = timer.repeat ? ts + timer.repeatHours * HOUR_MS : null;
        void scheduleBackground(alertFor(timer, ts + timer.durationMs, repeatUntil));
      }
    },
    setRepeat: (repeat) => {
      const ts = Date.now();
      dispatch({ type: "setRepeat", repeat, now: ts });
      // If running, the pending background alert must reflect the new setting.
      if (timer.status === "running" && timer.endsAt !== null) {
        const repeatUntil = repeat ? ts + timer.repeatHours * HOUR_MS : null;
        void scheduleBackground(alertFor({ ...timer, repeat }, timer.endsAt, repeatUntil));
      }
    },
    setRepeatHours: (hours) => dispatch({ type: "setRepeatHours", hours }),
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
