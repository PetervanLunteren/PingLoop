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

type Action =
  | { type: "select"; durationMs: number }
  | { type: "toggle"; now: number }
  | { type: "setRepeat"; repeat: boolean }
  | { type: "restart"; now: number }
  | { type: "finish" };

function reducer(timer: TimerState, action: Action): TimerState {
  switch (action.type) {
    case "select":
      return setDuration(timer, action.durationMs);
    case "toggle":
      return timer.status === "running"
        ? stop(timer)
        : start(timer, action.now);
    case "setRepeat":
      return { ...timer, repeat: action.repeat };
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
      if (timer.repeat) {
        void showNotification("Timer finished", "Starting the next round.");
        dispatch({ type: "restart", now });
      } else {
        void showNotification("Timer finished", "Your countdown is done.");
        dispatch({ type: "finish" });
      }
    }
  }, [now, timer]);

  const store: Store = {
    timer,
    now,
    selectInterval: (durationMs) => dispatch({ type: "select", durationMs }),
    toggle: () => {
      unlockAudio();
      // Use one timestamp for both the new end time and the display clock, so
      // the countdown starts exactly at the full interval with no lag jump.
      const ts = Date.now();
      setNow(ts);
      dispatch({ type: "toggle", now: ts });
    },
    setRepeat: (repeat) => dispatch({ type: "setRepeat", repeat }),
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
