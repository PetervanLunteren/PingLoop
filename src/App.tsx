import { useState } from "react";
import { StoreProvider } from "./state";
import { Timer } from "./components/Timer";
import { NotificationBell } from "./components/NotificationBell";
import { NotificationDialog } from "./components/NotificationDialog";
import { supportStatus, type NotificationSupport } from "./notify";

const logo = `${import.meta.env.BASE_URL}pingloop-wide-light.svg`;

export function App() {
  const [status, setStatus] = useState<NotificationSupport>(() => supportStatus());
  const [setupOpen, setSetupOpen] = useState(false);

  return (
    <StoreProvider>
      <div className="app">
        <header className="header">
          <NotificationBell
            needsAttention={status !== "granted"}
            onClick={() => setSetupOpen(true)}
          />
          <img className="logo" src={logo} alt="PingLoop" />
        </header>
        <main className="content">
          <Timer />
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
