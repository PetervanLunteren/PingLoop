import { Component, type ReactNode } from "react";
import { clearState } from "../storage";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes, most importantly a corrupt-storage throw from
 * loadState, and shows a loud, recoverable message instead of a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="error-screen card">
        <h2>Something went wrong</h2>
        <p className="meta">{error.message}</p>
        <p>
          Your saved data may be unreadable. You can clear it and reload to start
          fresh. This removes your timers, reminders, and pings.
        </p>
        <button
          className="btn btn-danger"
          onClick={() => {
            clearState();
            location.reload();
          }}
        >
          Clear data and reload
        </button>
      </div>
    );
  }
}
