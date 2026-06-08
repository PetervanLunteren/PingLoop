import { useState } from "react";
import { useStore } from "../state";

export function NewReminderForm() {
  const { addReminder } = useStore();
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");

  const dueAt = when ? new Date(when).getTime() : NaN;
  const valid = title.trim().length > 0 && Number.isFinite(dueAt);
  const inPast = valid && dueAt < Date.now();

  function submit() {
    if (!valid) return;
    addReminder(title.trim(), dueAt);
    setTitle("");
    setWhen("");
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
        <label htmlFor="reminder-title">Title</label>
        <input
          id="reminder-title"
          type="text"
          placeholder="Call the dentist"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="reminder-when">Date and time</label>
        <input
          id="reminder-when"
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
        />
      </div>

      {inPast && (
        <p className="meta" style={{ marginBottom: 12 }}>
          That time is in the past, so this reminder will fire right away.
        </p>
      )}

      <button className="btn btn-primary" type="submit" disabled={!valid}>
        Add reminder
      </button>
    </form>
  );
}
