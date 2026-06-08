// Thin wrapper over the Web Notifications API plus the environment detection the
// setup screen needs. On Android a notification must be shown through the
// service worker registration, so we prefer that and fall back to the direct
// constructor on desktop.

const ICON = `${import.meta.env.BASE_URL}pwa-192x192.png`;

export type NotificationSupport =
  | "unsupported" // no Notification API (for example an iOS Safari browser tab)
  | "default" // supported, permission not yet asked
  | "granted"
  | "denied";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function supportStatus(): NotificationSupport {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission as NotificationSupport;
}

export async function requestPermission(): Promise<NotificationSupport> {
  if (!notificationsSupported()) return "unsupported";
  const result = await Notification.requestPermission();
  return result as NotificationSupport;
}

export async function showNotification(
  title: string,
  body: string,
): Promise<void> {
  if (supportStatus() !== "granted") return;
  const options: NotificationOptions = { body, icon: ICON, badge: ICON };

  // Android Chrome only allows notifications via the service worker.
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return;
    } catch {
      // Fall through to the direct constructor (desktop browsers).
    }
  }

  try {
    new Notification(title, options);
  } catch {
    // If even this fails the sound still plays; nothing more we can do.
  }
}

/** iOS or iPadOS, where notifications need the installed PWA. */
export function isIOS(): boolean {
  const ua = navigator.userAgent;
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as a Mac, so detect a touch-capable "Mac" too.
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

/** True when running as an installed app rather than a browser tab. */
export function isStandalone(): boolean {
  const standaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (navigator as { standalone?: boolean }).standalone === true;
  return standaloneMedia || iosStandalone;
}
