import { useState } from "react";
import { StoreProvider } from "./state";
import { Timer } from "./components/Timer";
import { NotificationBell } from "./components/NotificationBell";
import { NotificationDialog } from "./components/NotificationDialog";
import { requestPermission, supportStatus, type NotificationSupport } from "./notify";

const mark = `${import.meta.env.BASE_URL}pingloop-icon.svg`;

export function App() {
  const [status, setStatus] = useState<NotificationSupport>(() => supportStatus());
  const [setupOpen, setSetupOpen] = useState(false);

  // Ask for notification permission. Called from Start when it is still off,
  // so a timer is never left without a way to reach you.
  async function requestNotifications() {
    setStatus(await requestPermission());
  }

  return (
    <StoreProvider>
      <div className="app">
        <header className="header">
          <NotificationBell
            needsAttention={status !== "granted"}
            onClick={() => setSetupOpen(true)}
          />
          {/* The wordmark is HTML text, not SVG text, so it stays crisp on iOS. */}
          <div className="brand">
            <img className="brand-mark" src={mark} alt="" aria-hidden="true" />
            <span className="brand-name">
              <strong>Ping</strong>Loop
            </span>
          </div>
        </header>
        <main className="content">
          <Timer
            notificationsGranted={status === "granted"}
            onRequestNotifications={requestNotifications}
            onShowSetup={() => setSetupOpen(true)}
          />
        </main>
        {setupOpen && (
          <NotificationDialog
            status={status}
            setStatus={setStatus}
            onClose={() => setSetupOpen(false)}
          />
        )}
      </div>
    </StoreProvider>
  );
}
