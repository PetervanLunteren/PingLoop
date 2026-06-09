import { useState } from "react";
import { useStore } from "../state";
import { remainingAt } from "../timer";
import { formatDuration } from "../format";

const MAX_CUSTOM_MIN = 600;

// Ring geometry. The radius drives the dash length below.
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface TimerProps {
  notificationsGranted: boolean;
  onRequestNotifications: () => Promise<void>;
}

export function Timer({ notificationsGranted, onRequestNotifications }: TimerProps) {
  const { timer, now, selectInterval, toggle, setRepeat } = useStore();

  const remaining = remainingAt(timer, now);
  const finished = timer.status === "finished";
  const running = timer.status === "running";
  const fraction = timer.durationMs > 0 ? remaining / timer.durationMs : 0;

  // The minutes input is the only length control, pre-filled from the saved
  // duration and remembered across reloads via the store's persistence.
  const [text, setText] = useState(() => String(Math.round(timer.durationMs / 60000)));

  function onInput(value: string) {
    setText(value);
    const minutes = clampMinutes(value);
    if (minutes) selectInterval(minutes * 60000);
  }

  function onBlur() {
    if (!clampMinutes(text)) {
      setText(String(Math.round(timer.durationMs / 60000)));
    }
  }

  // Starting a timer with notifications off means it cannot reach you when
  // closed, so ask for permission first. Only prompts when it is still off.
  async function handleToggle() {
    const starting = timer.status !== "running";
    if (starting && !notificationsGranted) {
      await onRequestNotifications();
    }
    toggle();
  }

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

      <div className="custom-row">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_CUSTOM_MIN}
          value={text}
          aria-label="Minutes"
          onChange={(e) => onInput(e.target.value)}
          onBlur={onBlur}
        />
        <span>minutes</span>
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

/** Parse a minutes string to a clamped integer, or 0 when invalid. */
function clampMinutes(value: string): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return 0;
  return Math.min(MAX_CUSTOM_MIN, n);
}
