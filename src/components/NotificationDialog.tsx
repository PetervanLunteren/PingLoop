import {
  isIOS,
  isStandalone,
  requestPermission,
  showNotification,
  type NotificationSupport,
} from "../notify";
import { playBeep, unlockAudio } from "../sound";

/**
 * Opened from the header bell. Holds everything about notifications and install:
 * turn them on, send a test ping, learn how to add PingLoop to the home screen,
 * and read the honest note on what cannot be guaranteed.
 */
export function NotificationDialog({
  status,
  setStatus,
  onClose,
}: {
  status: NotificationSupport;
  setStatus: (status: NotificationSupport) => void;
  onClose: () => void;
}) {
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
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog card"
        role="dialog"
        aria-modal="true"
        aria-label="Notifications and setup"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row between">
          <h2>Notifications</h2>
          <button className="btn btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <StatusBody status={status} onEnable={enable} />

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-sm" onClick={testPing}>
            Send test ping
          </button>
          <span className="meta">Plays a sound, and a notification if allowed.</span>
        </div>

        <h3>Add to your home screen</h3>
        <ul className="info-list">
          <li>Desktop Chrome or Edge: use the install icon in the address bar.</li>
          <li>Android Chrome: menu, then "Add to Home screen".</li>
          <li>iPhone or iPad Safari: share button, then "Add to Home Screen".</li>
        </ul>
        <p className="meta">
          Installing keeps PingLoop alive longer, so the alert is more likely to
          arrive. It also works offline.
        </p>

        <details className="limits">
          <summary>How reliable is this?</summary>
          <ul>
            <li>
              PingLoop has no server. The timer only fires while it is open in a
              tab or as an installed app.
            </li>
            <li>
              On iPhone and iPad, notifications need the installed app and iOS
              16.4 or later, and the system may still delay or drop them.
            </li>
            <li>
              If the device sleeps or the browser suspends the tab, the timer
              keeps its end time and fires when you reopen the app.
            </li>
          </ul>
        </details>
      </div>
    </div>
  );
}

function StatusBody({
  status,
  onEnable,
}: {
  status: NotificationSupport;
  onEnable: () => void;
}) {
  if (status === "granted") {
    return <p className="note">Notifications are on. The timer will alert you when it finishes.</p>;
  }

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
        PingLoop to your home screen and open it from there. iOS 16.4 or later is
        required.
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
