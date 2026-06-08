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

/**
 * Notification setup. Shown only while notifications are off, so it disappears
 * once they are granted. Lets the user turn them on and send a test ping.
 */
export function PermissionSetup() {
  const [status, setStatus] = useState<NotificationSupport>(() => supportStatus());

  if (status === "granted") return null;

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
      <h2>Notifications</h2>
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

function StatusBody({
  status,
  onEnable,
}: {
  status: NotificationSupport;
  onEnable: () => void;
}) {
  if (status === "default") {
    return (
      <>
        <p className="note">
          Allow notifications so the timer can reach you when it finishes.
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
        browser settings. The sound still plays while the app is open.
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
      This browser does not support notifications. The timer will still play a
      sound while PingLoop is open.
    </p>
  );
}

function Limitations() {
  return (
    <details className="limits">
      <summary>How reliable is this?</summary>
      <ul>
        <li>
          PingLoop has no server. The timer only fires while it is open in a tab
          or as an installed app.
        </li>
        <li>
          Install it to your home screen or desktop for the best chance of the
          alert arriving.
        </li>
        <li>
          On iPhone and iPad, notifications need the installed app and iOS 16.4
          or later, and the system may still delay or drop them.
        </li>
        <li>
          If the device sleeps or the browser suspends the tab, the timer keeps
          its end time and fires when you reopen the app.
        </li>
      </ul>
    </details>
  );
}
