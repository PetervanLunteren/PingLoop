import { useState } from "react";
import { useStore } from "../state";
import { remainingAt } from "../timer";
import { formatDuration } from "../format";

const INTERVALS_MIN = [5, 10, 15, 30, 55];
const MAX_CUSTOM_MIN = 600;

// Ring geometry. The radius drives the dash length below.
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function Timer() {
  const { timer, now, selectInterval, toggle, setRepeat } = useStore();

  const remaining = remainingAt(timer, now);
  const finished = timer.status === "finished";
  const running = timer.status === "running";
  const fraction = timer.durationMs > 0 ? remaining / timer.durationMs : 0;

  const currentMin = Math.round(timer.durationMs / 60000);
  const isCustom = !INTERVALS_MIN.includes(currentMin);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");

  function chooseCustom() {
    setCustomText(isCustom ? String(currentMin) : "");
    setCustomOpen(true);
  }

  function onCustomInput(value: string) {
    setCustomText(value);
    const minutes = clampMinutes(value);
    if (minutes) selectInterval(minutes * 60000);
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

      <div className="intervals" role="group" aria-label="Timer length">
        {INTERVALS_MIN.map((min) => {
          const ms = min * 60 * 1000;
          return (
            <button
              key={min}
              className={timer.durationMs === ms ? "interval active" : "interval"}
              aria-pressed={timer.durationMs === ms}
              onClick={() => {
                selectInterval(ms);
                setCustomOpen(false);
              }}
            >
              {min}
            </button>
          );
        })}
        <button
          className={isCustom ? "interval custom active" : "interval custom"}
          aria-pressed={isCustom}
          onClick={chooseCustom}
        >
          Custom
        </button>
      </div>

      {customOpen && (
        <div className="custom-row">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_CUSTOM_MIN}
            value={customText}
            placeholder="20"
            autoFocus
            onChange={(e) => onCustomInput(e.target.value)}
          />
          <span>minutes</span>
        </div>
      )}

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

      <button className="btn btn-primary toggle" onClick={toggle}>
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
