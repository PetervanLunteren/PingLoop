import { useStore } from "../state";
import { remainingAt } from "../timer";
import { formatDuration } from "../format";
import type { Timer } from "../types";

export function TimerCard({ timer }: { timer: Timer }) {
  const { now, startTimer, pauseTimer, resetTimer, deleteTimer } = useStore();
  const remaining = remainingAt(timer, now);
  const finished = timer.status === "finished";

  return (
    <div className="card">
      <div className="row between">
        <span className="title grow">{timer.label}</span>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => deleteTimer(timer.id)}
        >
          Delete
        </button>
      </div>

      <div className={finished ? "countdown finished" : "countdown"}>
        {finished ? "Done" : formatDuration(remaining)}
      </div>

      <div className="row" style={{ marginTop: 8 }}>
        {timer.status === "running" ? (
          <button className="btn btn-sm" onClick={() => pauseTimer(timer.id)}>
            Pause
          </button>
        ) : (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => startTimer(timer.id)}
          >
            {finished ? "Restart" : "Start"}
          </button>
        )}
        {timer.status !== "idle" && (
          <button className="btn btn-sm" onClick={() => resetTimer(timer.id)}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
