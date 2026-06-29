import { useState } from "react";
import { useStore } from "../state";
import { remainingAt } from "../timer";
import { formatDuration } from "../format";
import { isIOS, isStandalone } from "../notify";

const PRESETS_MIN = [30, 60];
const MAX_REPEAT_HOURS = 24;

// Ring geometry. The radius drives the dash length below.
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface TimerProps {
  notificationsGranted: boolean;
  onRequestNotifications: () => Promise<void>;
  onShowSetup: () => void;
}

export function Timer({
  notificationsGranted,
  onRequestNotifications,
  onShowSetup,
}: TimerProps) {
  const { timer, now, selectInterval, toggle, setRepeat, setRepeatHours } = useStore();

  const remaining = remainingAt(timer, now);
  const finished = timer.status === "finished";
  const running = timer.status === "running";
  const fraction = timer.durationMs > 0 ? remaining / timer.durationMs : 0;

  // "Stop after" hours, shown only when Repeat is on.
  const [hoursText, setHoursText] = useState(() => String(timer.repeatHours));

  function onHoursInput(value: string) {
    setHoursText(value);
    const hours = clampHours(value);
    if (hours) setRepeatHours(hours);
  }

  function onHoursBlur() {
    if (!clampHours(hoursText)) setHoursText(String(timer.repeatHours));
  }

  // Starting a timer with notifications off means it cannot reach you when
  // closed, so sort that out first.
  async function handleToggle() {
    const starting = timer.status !== "running";
    if (starting && !notificationsGranted) {
      // On iOS, notifications only work from the installed app, so a Safari tab
      // can never ping. Show the install steps and do not start.
      if (isIOS() && !isStandalone()) {
        onShowSetup();
        return;
      }
      // Elsewhere a tab can notify, so just ask for permission.
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

      <div className="intervals" role="group" aria-label="Focus length">
        {PRESETS_MIN.map((min) => {
          const ms = min * 60 * 1000;
          return (
            <button
              key={min}
              className={timer.durationMs === ms ? "interval active" : "interval"}
              aria-pressed={timer.durationMs === ms}
              onClick={() => selectInterval(ms)}
            >
              {min} min
            </button>
          );
        })}
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

      {timer.repeat && (
        <div className="custom-row">
          <span>Stop after</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_REPEAT_HOURS}
            value={hoursText}
            aria-label="Stop repeating after this many hours"
            onChange={(e) => onHoursInput(e.target.value)}
            onBlur={onHoursBlur}
          />
          <span>hours</span>
        </div>
      )}

      <button className="btn btn-primary toggle" onClick={() => void handleToggle()}>
        {running ? "Stop" : "Start"}
      </button>
    </section>
  );
}

/** Parse an hours string to a clamped integer, or 0 when invalid. */
function clampHours(value: string): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return 0;
  return Math.min(MAX_REPEAT_HOURS, n);
}
