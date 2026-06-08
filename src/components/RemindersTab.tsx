import { useStore } from "../state";
import { EmptyState } from "./EmptyState";
import { NewReminderForm } from "./NewReminderForm";
import { ReminderCard } from "./ReminderCard";

export function RemindersTab() {
  const { state } = useStore();
  const sorted = [...state.reminders].sort((a, b) => a.dueAt - b.dueAt);

  return (
    <>
      <p className="section-intro">
        One-time nudges at a specific date and time, like "call the dentist".
      </p>
      <NewReminderForm />
      {sorted.length === 0 ? (
        <EmptyState
          title="No reminders yet"
          hint="Add one above. It fires once when its time arrives."
        />
      ) : (
        sorted.map((reminder) => (
          <ReminderCard key={reminder.id} reminder={reminder} />
        ))
      )}
    </>
  );
}
