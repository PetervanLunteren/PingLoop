import { useState } from "react";
import { StoreProvider } from "./state";
import { Tabs, type TabKey } from "./components/Tabs";
import { PermissionSetup } from "./components/PermissionSetup";
import { TimersTab } from "./components/TimersTab";
import { RemindersTab } from "./components/RemindersTab";
import { PingsTab } from "./components/PingsTab";

const logo = `${import.meta.env.BASE_URL}pingloop-wide-v2.svg`;

export function App() {
  const [tab, setTab] = useState<TabKey>("timers");

  return (
    <StoreProvider>
      <div className="app">
        <header className="header">
          <img src={logo} alt="PingLoop" />
        </header>
        <main className="content">
          <PermissionSetup />
          <Tabs active={tab} onChange={setTab} />
          {tab === "timers" && <TimersTab />}
          {tab === "reminders" && <RemindersTab />}
          {tab === "pings" && <PingsTab />}
        </main>
      </div>
    </StoreProvider>
  );
}
