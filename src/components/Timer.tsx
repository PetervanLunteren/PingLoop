import { useEffect } from "react";
import { useStore } from "../state";
import { remainingAt } from "../timer";
import { formatDuration } from "../format";

const MIN_MINUTES = 5;
const MAX_MINUTES = 120;
const STEP_MINUTES = 5;

const OPTIONS: number[] = [];
for (let m = MIN_MINUTES; m <= MAX_MINUTES; m += STEP_MINUTES) OPTIONS.push(m);

// Ring geometry. The radius drives the dash length below.
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface TimerProps {
  notificationsGranted: boolean;
  onRequestNotifications: () => Promise<void>;
}

export function Timer({ notificationsGranted, onRequestNotifications }: TimerProps) {
  const { timer, now, selectInterval, toggle, setRepeat } = useStore();

  // Starting a timer with notifications off means it cannot reach you when
  // closed, so ask for permission first. Only prompts when it is still off.
  async function handleToggle() {
    const starting = timer.status !== "running";
    if (starting && !notificationsGranted) {
      await onRequestNotifications();
    }
    toggle();
  }

  const remaining = remainingAt(timer, now);
  const finished = timer.status === "finished";
  const running = timer.status === "running";
  const fraction = timer.durationMs > 0 ? remaining / timer.durationMs : 0;

  const currentMin = Math.round(timer.durationMs / 60000);
  // A saved value might not be on the list (for example an older value). Show
  // the nearest option and snap the stored duration to match.
  const selectedMin = OPTIONS.includes(currentMin) ? currentMin : nearestOption(currentMin);
  useEffect(() => {
    if (selectedMin !== currentMin) selectInterval(selectedMin * 60000);
  }, [selectedMin, currentMin, selectInterval]);

  return (
    <section className="timer card">
      <div className="dial">
        <svg viewBox="0 0 100 100" className="ring" aria-hidden="true">
          <defs>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <circle className="ring-track" cx="50" cy="50" r={RADIUS} />
          <circle
            className="ring-progress"
            cx="50"
            cy="50"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          />
        </svg>
        <div className={finished ? "dial-time finished" : "dial-time"}>
          {finished ? "Done" : formatDuration(remaining)}
        </div>
      </div>

      <div className="length-row">
        <select
          className="minutes-select"
          value={String(selectedMin)}
          aria-label="Timer length in minutes"
          onChange={(e) => selectInterval(Number(e.target.value) * 60000)}
        >
          {OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m} minutes
            </option>
          ))}
        </select>
      </div>

      <div className="repeat-row">
        <span>Repeat</span>
        <button
          className={timer.repeat ? "switch on" : "switch"}
          role="switch"
          aria-checked={timer.repeat}
          aria-label="Repeat the timer after it ends"
          onClick={() => setRepeat(!timer.repeat)}
        >
          <span className="knob" />
        </button>
      </div>

      <button className="btn btn-primary toggle" onClick={() => void handleToggle()}>
        {running ? "Stop" : "Start"}
      </button>
    </section>
  );
}

function nearestOption(min: number): number {
  return OPTIONS.reduce(
    (best, m) => (Math.abs(m - min) < Math.abs(best - min) ? m : best),
    MIN_MINUTES,
  );
}
