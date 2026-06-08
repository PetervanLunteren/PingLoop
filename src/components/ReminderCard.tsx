import { useStore } from "../state";
import { formatDateTime } from "../format";
import type { Reminder } from "../types";

export function ReminderCard({ reminder }: { reminder: Reminder }) {
  const { deleteReminder } = useStore();

  return (
    <div className="card">
      <div className="row between">
        <div className="grow">
          <div className="title">{reminder.title}</div>
          <div className="meta">{formatDateTime(reminder.dueAt)}</div>
        </div>
        <div className="row">
          <span className={reminder.fired ? "pill off" : "pill on"}>
            {reminder.fired ? "Done" : "Upcoming"}
          </span>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => deleteReminder(reminder.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
