import { useStore } from "../state";
import { EmptyState } from "./EmptyState";
import { PingForm } from "./PingForm";
import { PingCard } from "./PingCard";

export function PingsTab() {
  const { state, addPing } = useStore();

  return (
    <>
      <p className="section-intro">
        Repeating nudges on a schedule, like a ping every hour from 09:00 to
        17:00 on weekdays.
      </p>
      <PingForm submitLabel="Add ping" resetOnSubmit onSubmit={addPing} />
      {state.pings.length === 0 ? (
        <EmptyState
          title="No pings yet"
          hint="Add one above to get a regular nudge during the day."
        />
      ) : (
        state.pings.map((ping) => <PingCard key={ping.id} ping={ping} />)
      )}
    </>
  );
}
