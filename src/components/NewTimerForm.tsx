import { useState } from "react";
import { useStore } from "../state";

const PRESET_MINUTES = [5, 10, 15, 25, 45];

export function NewTimerForm() {
  const { addTimer } = useStore();
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);

  const durationMs = (minutes * 60 + seconds) * 1000;
  const valid = durationMs > 0;

  function submit() {
    if (!valid) return;
    addTimer(label.trim() || "Timer", durationMs);
    setLabel("");
  }

  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="field">
        <label htmlFor="timer-label">Label</label>
        <input
          id="timer-label"
          type="text"
          placeholder="Study"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <div className="presets">
        {PRESET_MINUTES.map((m) => (
          <button
            type="button"
            key={m}
            className={minutes === m && seconds === 0 ? "preset active" : "preset"}
            onClick={() => {
              setMinutes(m);
              setSeconds(0);
            }}
          >
            {m} min
          </button>
        ))}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="timer-min">Minutes</label>
          <input
            id="timer-min"
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(clamp(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor="timer-sec">Seconds</label>
          <input
            id="timer-sec"
            type="number"
            min={0}
            max={59}
            value={seconds}
            onChange={(e) => setSeconds(clamp(e.target.value))}
          />
        </div>
      </div>

      <button className="btn btn-primary" type="submit" disabled={!valid}>
        Add timer
      </button>
    </form>
  );
}

function clamp(value: string): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
