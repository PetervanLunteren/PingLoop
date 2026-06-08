import { useStore } from "../state";
import { remainingAt } from "../timer";
import { formatDuration } from "../format";

const INTERVALS_MIN = [5, 10, 15, 30, 55, 60];

// Ring geometry. The radius drives the dash length below.
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function Timer() {
  const { timer, now, selectInterval, toggle, setRepeat } = useStore();

  const remaining = remainingAt(timer, now);
  const finished = timer.status === "finished";
  const running = timer.status === "running";
  const fraction = timer.durationMs > 0 ? remaining / timer.durationMs : 0;

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
              onClick={() => selectInterval(ms)}
            >
              {min}
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

      <button className="btn btn-primary toggle" onClick={toggle}>
        {running ? "Stop" : "Start"}
      </button>
    </section>
  );
}
