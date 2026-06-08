import {
  isIOS,
  isStandalone,
  requestPermission,
  showNotification,
  type NotificationSupport,
} from "../notify";
import { playBeep, unlockAudio } from "../sound";

/**
 * Opened from the header bell. Kept deliberately short: turn notifications on
 * (only shown while they are off), send a test ping, and one install hint for
 * the user's own device.
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
    void showNotification("Test ping", "PingLoop is working.");
  }

  const installHint = getInstallHint();

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

        {status !== "granted" && <EnableBlock status={status} onEnable={enable} />}

        <button className="btn btn-sm dialog-action" onClick={testPing}>
          Send test ping
        </button>

        {installHint && (
          <>
            <h3>Add to your home screen</h3>
            <p className="note">{installHint}</p>
          </>
        )}
      </div>
    </div>
  );
}

function EnableBlock({
  status,
  onEnable,
}: {
  status: NotificationSupport;
  onEnable: () => void;
}) {
  if (status === "default") {
    return (
      <>
        <p className="note">Turn on notifications so the timer can alert you.</p>
        <button className="btn btn-primary btn-sm dialog-action" onClick={onEnable}>
          Turn on notifications
        </button>
      </>
    );
  }

  if (status === "denied") {
    return (
      <p className="note">
        Notifications are blocked. Allow them for this site in your browser
        settings.
      </p>
    );
  }

  // unsupported
  if (isIOS()) {
    return (
      <p className="note">
        Add PingLoop to your home screen first, then turn on notifications.
      </p>
    );
  }
  return (
    <p className="note">
      This browser cannot show notifications. The timer still plays a sound.
    </p>
  );
}

/** One install line for the user's device, or null if already installed. */
function getInstallHint(): string | null {
  if (isStandalone()) return null;
  if (isIOS()) return 'Tap the share button, then "Add to Home Screen".';
  if (/Android/i.test(navigator.userAgent)) {
    return 'Open the browser menu, then "Add to Home screen".';
  }
  return "Use the install icon in your browser's address bar.";
}
