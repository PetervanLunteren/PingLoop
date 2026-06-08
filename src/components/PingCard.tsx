import { useState } from "react";
import { useStore, type PingInput } from "../state";
import { nextPingAt } from "../recurrence";
import {
  formatDateTime,
  minutesToTimeLabel,
  summarizeDays,
} from "../format";
import type { RecurringPing } from "../types";
import { PingForm } from "./PingForm";

export function PingCard({ ping }: { ping: RecurringPing }) {
  const { now, togglePing, updatePing, deletePing } = useStore();
  const [editing, setEditing] = useState(false);

  if (editing) {
    const initial: PingInput = {
      title: ping.title,
      intervalMinutes: ping.intervalMinutes,
      startMinutes: ping.startMinutes,
      endMinutes: ping.endMinutes,
      activeDays: ping.activeDays,
    };
    return (
      <PingForm
        initial={initial}
        submitLabel="Save"
        onSubmit={(input) => {
          updatePing(ping.id, input);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const next = nextPingAt(ping, now);
  const schedule = `Every ${ping.intervalMinutes} min, ${minutesToTimeLabel(
    ping.startMinutes,
  )} to ${minutesToTimeLabel(ping.endMinutes)}`;

  return (
    <div className="card">
      <div className="row between">
        <div className="grow">
          <div className="title">{ping.title}</div>
          <div className="meta">{schedule}</div>
          <div className="meta">{summarizeDays(ping.activeDays)}</div>
        </div>
        <span className={ping.enabled ? "pill on" : "pill off"}>
          {ping.enabled ? "On" : "Off"}
        </span>
      </div>

      <div className="meta" style={{ marginTop: 8 }}>
        {ping.enabled
          ? next
            ? `Next ping ${formatDateTime(next)}`
            : "No upcoming ping"
          : "Disabled"}
      </div>

      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn btn-sm" onClick={() => togglePing(ping.id)}>
          {ping.enabled ? "Disable" : "Enable"}
        </button>
        <button className="btn btn-sm" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => deletePing(ping.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
