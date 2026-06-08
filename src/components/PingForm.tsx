import { useState } from "react";
import type { PingInput } from "../state";
import type { Weekday } from "../types";
import {
  WEEKDAYS_MON_FIRST,
  minutesToTimeLabel,
  timeLabelToMinutes,
  weekdayShort,
} from "../format";

const DEFAULTS: PingInput = {
  title: "",
  intervalMinutes: 60,
  startMinutes: 9 * 60,
  endMinutes: 17 * 60,
  activeDays: [1, 2, 3, 4, 5],
};

interface Props {
  initial?: PingInput;
  submitLabel: string;
  resetOnSubmit?: boolean;
  onSubmit: (input: PingInput) => void;
  onCancel?: () => void;
}

export function PingForm({
  initial,
  submitLabel,
  resetOnSubmit = false,
  onSubmit,
  onCancel,
}: Props) {
  const base = initial ?? DEFAULTS;
  const [title, setTitle] = useState(base.title);
  const [intervalMinutes, setIntervalMinutes] = useState(base.intervalMinutes);
  const [startMinutes, setStartMinutes] = useState(base.startMinutes);
  const [endMinutes, setEndMinutes] = useState(base.endMinutes);
  const [activeDays, setActiveDays] = useState<Weekday[]>(base.activeDays);

  const error = validate(title, intervalMinutes, startMinutes, endMinutes, activeDays);

  function toggleDay(day: Weekday) {
    setActiveDays((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
    );
  }

  function submit() {
    if (error) return;
    onSubmit({
      title: title.trim(),
      intervalMinutes,
      startMinutes,
      endMinutes,
      activeDays: [...activeDays].sort((a, b) => a - b),
    });
    if (resetOnSubmit) {
      setTitle("");
      setIntervalMinutes(DEFAULTS.intervalMinutes);
      setStartMinutes(DEFAULTS.startMinutes);
      setEndMinutes(DEFAULTS.endMinutes);
      setActiveDays(DEFAULTS.activeDays);
    }
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
        <label htmlFor="ping-title">Title</label>
        <input
          id="ping-title"
          type="text"
          placeholder="Stand up and stretch"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="ping-interval">Every (minutes)</label>
        <input
          id="ping-interval"
          type="number"
          min={1}
          value={intervalMinutes}
          onChange={(e) => setIntervalMinutes(Math.floor(Number(e.target.value)) || 0)}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="ping-start">From</label>
          <input
            id="ping-start"
            type="time"
            value={minutesToTimeLabel(startMinutes)}
            onChange={(e) =>
              e.target.value && setStartMinutes(timeLabelToMinutes(e.target.value))
            }
          />
        </div>
        <div className="field">
          <label htmlFor="ping-end">To</label>
          <input
            id="ping-end"
            type="time"
            value={minutesToTimeLabel(endMinutes)}
            onChange={(e) =>
              e.target.value && setEndMinutes(timeLabelToMinutes(e.target.value))
            }
          />
        </div>
      </div>

      <div className="field">
        <label>Active days</label>
        <div className="days">
          {WEEKDAYS_MON_FIRST.map((day) => (
            <button
              type="button"
              key={day}
              className={activeDays.includes(day) ? "day on" : "day"}
              aria-pressed={activeDays.includes(day)}
              onClick={() => toggleDay(day)}
            >
              {weekdayShort(day)}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="meta" style={{ marginBottom: 12 }}>{error}</p>}

      <div className="row">
        <button className="btn btn-primary" type="submit" disabled={Boolean(error)}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function validate(
  title: string,
  intervalMinutes: number,
  startMinutes: number,
  endMinutes: number,
  activeDays: Weekday[],
): string | null {
  if (title.trim().length === 0) return "Give the ping a title.";
  if (intervalMinutes < 1) return "Interval must be at least 1 minute.";
  if (endMinutes <= startMinutes) return "End time must be after start time.";
  if (activeDays.length === 0) return "Pick at least one active day.";
  return null;
}
