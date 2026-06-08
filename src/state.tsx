// The single source of truth: a reducer over all app state, persisted to
// localStorage, plus one scheduling loop that fires notifications while the app
// is open. This is the whole engine; the components are thin views over it.

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { AppState, ID, RecurringPing, Timer } from "./types";
import { loadState, saveState } from "./storage";
import { isFinished, markFinished, pause, reset, start } from "./timer";
import { dueSlot } from "./recurrence";
import { showNotification } from "./notify";
import { playBeep, unlockAudio } from "./sound";

/** The editable fields of a recurring ping (everything except id and runtime). */
export interface PingInput {
  title: string;
  intervalMinutes: number;
  startMinutes: number;
  endMinutes: number;
  activeDays: RecurringPing["activeDays"];
}

type Action =
  | { type: "addTimer"; label: string; durationMs: number }
  | { type: "startTimer"; id: ID }
  | { type: "pauseTimer"; id: ID }
  | { type: "resetTimer"; id: ID }
  | { type: "deleteTimer"; id: ID }
  | { type: "finishTimer"; id: ID }
  | { type: "addReminder"; title: string; dueAt: number }
  | { type: "deleteReminder"; id: ID }
  | { type: "fireReminder"; id: ID }
  | { type: "addPing"; input: PingInput; now: number }
  | { type: "updatePing"; id: ID; input: PingInput; now: number }
  | { type: "togglePing"; id: ID }
  | { type: "deletePing"; id: ID }
  | { type: "firePing"; id: ID; slot: number };

function newId(): ID {
  return crypto.randomUUID();
}

function mapTimer(state: AppState, id: ID, fn: (t: Timer) => Timer): AppState {
  return { ...state, timers: state.timers.map((t) => (t.id === id ? fn(t) : t)) };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "addTimer": {
      const timer: Timer = {
        id: newId(),
        label: action.label,
        durationMs: action.durationMs,
        remainingMs: action.durationMs,
        endsAt: null,
        status: "idle",
      };
      return { ...state, timers: [...state.timers, timer] };
    }
    case "startTimer":
      return mapTimer(state, action.id, (t) =>
        start(t.status === "finished" ? reset(t) : t, Date.now()),
      );
    case "pauseTimer":
      return mapTimer(state, action.id, (t) => pause(t, Date.now()));
    case "resetTimer":
      return mapTimer(state, action.id, (t) => reset(t));
    case "finishTimer":
      return mapTimer(state, action.id, (t) => markFinished(t));
    case "deleteTimer":
      return { ...state, timers: state.timers.filter((t) => t.id !== action.id) };

    case "addReminder": {
      const reminder = {
        id: newId(),
        title: action.title,
        dueAt: action.dueAt,
        fired: false,
      };
      return { ...state, reminders: [...state.reminders, reminder] };
    }
    case "fireReminder":
      return {
        ...state,
        reminders: state.reminders.map((r) =>
          r.id === action.id ? { ...r, fired: true } : r,
        ),
      };
    case "deleteReminder":
      return {
        ...state,
        reminders: state.reminders.filter((r) => r.id !== action.id),
      };

    case "addPing": {
      const ping: RecurringPing = {
        id: newId(),
        ...action.input,
        enabled: true,
        // Anchor to creation time so we never fire for a slot earlier today.
        lastFiredAt: action.now,
      };
      return { ...state, pings: [...state.pings, ping] };
    }
    case "updatePing":
      return {
        ...state,
        pings: state.pings.map((p) =>
          p.id === action.id
            ? { ...p, ...action.input, lastFiredAt: action.now }
            : p,
        ),
      };
    case "togglePing":
      return {
        ...state,
        pings: state.pings.map((p) =>
          p.id === action.id ? { ...p, enabled: !p.enabled } : p,
        ),
      };
    case "firePing":
      return {
        ...state,
        pings: state.pings.map((p) =>
          p.id === action.id ? { ...p, lastFiredAt: action.slot } : p,
        ),
      };
    case "deletePing":
      return { ...state, pings: state.pings.filter((p) => p.id !== action.id) };
  }
}

interface Store {
  state: AppState;
  /** Current time in epoch ms, refreshed every second for live countdowns. */
  now: number;
  addTimer: (label: string, durationMs: number) => void;
  startTimer: (id: ID) => void;
  pauseTimer: (id: ID) => void;
  resetTimer: (id: ID) => void;
  deleteTimer: (id: ID) => void;
  addReminder: (title: string, dueAt: number) => void;
  deleteReminder: (id: ID) => void;
  addPing: (input: PingInput) => void;
  updatePing: (id: ID, input: PingInput) => void;
  togglePing: (id: ID) => void;
  deletePing: (id: ID) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [now, setNow] = useState(() => Date.now());

  // One global clock drives every live countdown and the scheduler.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Persist on every change. Running timers do not mutate state each second
  // (their countdown is derived), so this stays cheap.
  useEffect(() => {
    saveState(state);
  }, [state]);

  // The scheduler: each tick, detect anything due, mark it fired in state, and
  // raise one notification plus one sound per event. Marking state prevents a
  // second fire on the next tick.
  useEffect(() => {
    const events: Array<{ title: string; body: string }> = [];

    for (const timer of state.timers) {
      if (isFinished(timer, now)) {
        dispatch({ type: "finishTimer", id: timer.id });
        events.push({ title: "Timer finished", body: timer.label });
      }
    }
    for (const reminder of state.reminders) {
      if (!reminder.fired && now >= reminder.dueAt) {
        dispatch({ type: "fireReminder", id: reminder.id });
        events.push({ title: "Reminder", body: reminder.title });
      }
    }
    for (const ping of state.pings) {
      const slot = dueSlot(ping, now);
      if (slot !== null && (ping.lastFiredAt === null || ping.lastFiredAt < slot)) {
        dispatch({ type: "firePing", id: ping.id, slot });
        events.push({ title: "Ping", body: ping.title });
      }
    }

    if (events.length > 0) {
      playBeep();
      for (const event of events) void showNotification(event.title, event.body);
    }
  }, [now, state]);

  const store: Store = {
    state,
    now,
    addTimer: (label, durationMs) => {
      unlockAudio();
      dispatch({ type: "addTimer", label, durationMs });
    },
    startTimer: (id) => {
      unlockAudio();
      dispatch({ type: "startTimer", id });
    },
    pauseTimer: (id) => dispatch({ type: "pauseTimer", id }),
    resetTimer: (id) => dispatch({ type: "resetTimer", id }),
    deleteTimer: (id) => dispatch({ type: "deleteTimer", id }),
    addReminder: (title, dueAt) => {
      unlockAudio();
      dispatch({ type: "addReminder", title, dueAt });
    },
    deleteReminder: (id) => dispatch({ type: "deleteReminder", id }),
    addPing: (input) => {
      unlockAudio();
      dispatch({ type: "addPing", input, now: Date.now() });
    },
    updatePing: (id, input) =>
      dispatch({ type: "updatePing", id, input, now: Date.now() }),
    togglePing: (id) => dispatch({ type: "togglePing", id }),
    deletePing: (id) => dispatch({ type: "deletePing", id }),
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
