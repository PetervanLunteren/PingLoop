// The app is a remote control for the worker's timer. It holds the run it last
// read from the server, a one-second clock so the countdown ticks, and nothing
// else. No timer engine, no notifications, no re-syncing: the worker owns all of
// that, and the push notification is the only alert.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Schedule } from "./types";
import { getSchedule, startSchedule, stopSchedule } from "./api";
import { isRunning } from "./schedule";
import { loadIntervalPref, saveIntervalPref } from "./storage";

type Status = "loading" | "ready" | "error";

interface Store {
  schedule: Schedule | null;
  /** The interval to use when nothing is running, remembered across visits. */
  intervalMs: number;
  status: Status;
  error: string | null;
  /** Current time in epoch ms, refreshed every second for the live countdown. */
  now: number;
  selectInterval: (intervalMs: number) => void;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  refresh: () => Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [intervalMs, setIntervalMs] = useState(() => loadIntervalPref());
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // One clock, only so the countdown re-renders. It decides nothing.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  async function run(action: () => Promise<void>): Promise<void> {
    setError(null);
    try {
      await action();
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function refresh(): Promise<void> {
    await run(async () => {
      setSchedule(await getSchedule());
    });
  }

  // Read the run from the worker on open. It is the only source of truth.
  useEffect(() => {
    void refresh();
    // Mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const store: Store = {
    schedule,
    // A live run dictates the interval. Once it is over, fall back to the
    // preference, so the pills and Start never disagree about the length.
    intervalMs: isRunning(schedule, now) && schedule ? schedule.intervalMs : intervalMs,
    status,
    error,
    now,
    selectInterval: (next) => {
      setIntervalMs(next);
      saveIntervalPref(next);
    },
    start: () =>
      run(async () => {
        setSchedule(await startSchedule(intervalMs));
        setNow(Date.now());
      }),
    stop: () =>
      run(async () => {
        await stopSchedule();
        setSchedule(null);
      }),
    refresh,
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
