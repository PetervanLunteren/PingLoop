// Background push client. Talks to the optional Cloudflare Worker backend so the
// timer can alert with the app closed. Everything here is a no-op unless the
// backend is configured at build time, so a plain GitHub Pages deploy still
// works as a foreground-only timer.

import { isIOS, isStandalone } from "./notify";

const API = import.meta.env.VITE_PUSH_API;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/** True when a push backend is configured. Used by the UI for honest copy. */
export const pushEnabled = Boolean(API && VAPID_PUBLIC_KEY);

export interface BackgroundAlert {
  fireAt: number;
  title: string;
  body: string;
  repeat: boolean;
  intervalMs: number;
}

/** Register (or update) a background alert for the running timer. */
export async function scheduleBackground(alert: BackgroundAlert): Promise<void> {
  const subscription = await getSubscription();
  if (!subscription || !API) return;
  await post(`${API}/schedule`, {
    subscription: subscription.toJSON(),
    fireAt: alert.fireAt,
    title: alert.title,
    body: alert.body,
    repeat: alert.repeat,
    intervalMs: alert.intervalMs,
  });
}

/** Cancel any background alert for this device. */
export async function cancelBackground(): Promise<void> {
  if (!pushEnabled || !API || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await post(`${API}/cancel`, { endpoint: subscription.endpoint });
}

function canSubscribe(): boolean {
  if (!pushEnabled) return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (Notification.permission !== "granted") return false;
  // iOS only allows push from the installed PWA, not a Safari tab.
  if (isIOS() && !isStandalone()) return false;
  return true;
}

async function getSubscription(): Promise<PushSubscription | null> {
  if (!canSubscribe() || !VAPID_PUBLIC_KEY) return null;
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
}

async function post(url: string, body: unknown): Promise<void> {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Network failure only affects the background alert. The foreground timer
    // still works, so we degrade quietly rather than break the timer.
  }
}

/** VAPID keys are URL-safe base64; PushManager wants raw bytes. */
function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
