import { useStore } from "../state";
import { EmptyState } from "./EmptyState";
import { NewTimerForm } from "./NewTimerForm";
import { TimerCard } from "./TimerCard";

export function TimersTab() {
  const { state } = useStore();

  return (
    <>
      <p className="section-intro">
        Countdowns that beep and notify when they reach zero, like a 25 minute
        study timer.
      </p>
      <NewTimerForm />
      {state.timers.length === 0 ? (
        <EmptyState
          title="No timers yet"
          hint="Add one above. It keeps counting even if you reload the page."
        />
      ) : (
        state.timers.map((timer) => <TimerCard key={timer.id} timer={timer} />)
      )}
    </>
  );
}
