import { useState } from "react";
import {
  isIOS,
  isStandalone,
  requestPermission,
  showNotification,
  supportStatus,
  type NotificationSupport,
} from "../notify";
import { playBeep, unlockAudio } from "../sound";

export function PermissionSetup() {
  const [status, setStatus] = useState<NotificationSupport>(() => supportStatus());

  async function enable() {
    unlockAudio();
    setStatus(await requestPermission());
  }

  function testPing() {
    unlockAudio();
    playBeep();
    void showNotification("Test ping", "Notifications and sound are working.");
  }

  return (
    <section className="card setup">
      <div className="row between">
        <h2>Notifications</h2>
        <StatusPill status={status} />
      </div>

      <StatusBody status={status} onEnable={enable} />

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn btn-sm" onClick={testPing}>
          Send test ping
        </button>
        <span className="meta">Plays a sound, and a notification if allowed.</span>
      </div>

      <Limitations />
    </section>
  );
}

function StatusPill({ status }: { status: NotificationSupport }) {
  if (status === "granted") return <span className="pill on">On</span>;
  return <span className="pill off">Off</span>;
}

function StatusBody({
  status,
  onEnable,
}: {
  status: NotificationSupport;
  onEnable: () => void;
}) {
  if (status === "granted") {
    return (
      <p className="note">
        Notifications are on. Pings will show while PingLoop is open.
      </p>
    );
  }

  if (status === "default") {
    return (
      <>
        <p className="note">
          Allow notifications so timers, reminders, and pings can reach you.
        </p>
        <button className="btn btn-primary btn-sm" onClick={onEnable}>
          Enable notifications
        </button>
      </>
    );
  }

  if (status === "denied") {
    return (
      <p className="note">
        Notifications are blocked. Turn them back on for this site in your
        browser settings. Sounds still play while the app is open.
      </p>
    );
  }

  // unsupported
  if (isIOS() && !isStandalone()) {
    return (
      <p className="note">
        This iPhone or iPad browser cannot show notifications in a tab. Add
        PingLoop to your home screen (share button, then "Add to Home Screen")
        and open it from there. iOS 16.4 or later is required.
      </p>
    );
  }
  return (
    <p className="note">
      This browser does not support notifications. Timers and pings will still
      play a sound while PingLoop is open.
    </p>
  );
}

function Limitations() {
  return (
    <details className="limits">
      <summary>How reliable is this?</summary>
      <ul>
        <li>
          PingLoop has no server. Pings only fire while it is open in a tab or as
          an installed app.
        </li>
        <li>
          Install it to your home screen or desktop for the best chance of pings
          arriving.
        </li>
        <li>
          On iPhone and iPad, notifications need the installed app and iOS 16.4
          or later, and the system may still delay or drop them.
        </li>
        <li>
          If the device sleeps or the browser suspends the tab, pings can be late
          or missed. They catch up when you reopen the app.
        </li>
      </ul>
    </details>
  );
}
