import { useStore } from "../state";
import { isRunning, remainingMs } from "../schedule";
import { formatDuration } from "../format";
import { isIOS, isStandalone } from "../notify";

const PRESETS_MIN = [30, 60];

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
  const { schedule, intervalMs, status, error, now, selectInterval, start, stop, refresh } =
    useStore();

  const running = isRunning(schedule, now);
  const remaining = remainingMs(schedule, now, intervalMs);
  const fraction = intervalMs > 0 ? remaining / intervalMs : 0;
  const busy = status === "loading";

  // A timer that cannot ping is pointless, so notifications come first. On iOS
  // they only work from the installed app, so send the user there instead.
  async function handleStart() {
    if (!notificationsGranted) {
      if (isIOS() && !isStandalone()) {
        onShowSetup();
        return;
      }
      await onRequestNotifications();
    }
    await start();
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
        <div className="dial-time">{formatDuration(remaining)}</div>
      </div>

      <div className="intervals" role="group" aria-label="Focus length">
        {PRESETS_MIN.map((min) => {
          const ms = min * 60 * 1000;
          return (
            <button
              key={min}
              className={intervalMs === ms ? "interval active" : "interval"}
              aria-pressed={intervalMs === ms}
              disabled={running || busy}
              onClick={() => selectInterval(ms)}
            >
              {min} min
            </button>
          );
        })}
      </div>

      {error && (
        <p className="banner">
          {error}{" "}
          <button className="banner-retry" onClick={() => void refresh()}>
            Retry
          </button>
        </p>
      )}

      <button
        className="btn btn-primary toggle"
        disabled={busy}
        onClick={() => void (running ? stop() : handleStart())}
      >
        {running ? "Stop" : "Start"}
      </button>
    </section>
  );
}
