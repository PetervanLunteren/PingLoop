// Talks to the worker, which owns the timer. The app reads the run, starts it
// and stops it. Nothing here is optional: without the backend there are no
// pings, so a missing setting is a hard failure rather than a quiet no-op.

import { isIOS, isStandalone } from "./notify";
import type { Schedule } from "./types";

/** Fail at load, not at the first Start, when the build forgot a setting. */
function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`PingLoop is missing ${name}. Without it the app cannot ping you.`);
  }
  return value;
}

const API = required(import.meta.env.VITE_PUSH_API, "VITE_PUSH_API");
const VAPID_PUBLIC_KEY = required(
  import.meta.env.VITE_VAPID_PUBLIC_KEY,
  "VITE_VAPID_PUBLIC_KEY",
);

/** The current run, or null when nothing is scheduled. */
export async function getSchedule(): Promise<Schedule | null> {
  return request<Schedule | null>("GET");
}

/** Start a run. The worker picks the ping times; we only choose the interval. */
export async function startSchedule(intervalMs: number): Promise<Schedule> {
  const subscription = await ensureSubscription();
  return request<Schedule>("POST", {
    subscription: subscription.toJSON(),
    intervalMs,
  });
}

export async function stopSchedule(): Promise<void> {
  await request<unknown>("DELETE");
}

/**
 * The push subscription for this device, creating it on first use. Throws with a
 * clear reason when the browser cannot subscribe, because a timer that cannot
 * ping is pointless.
 */
export async function ensureSubscription(): Promise<PushSubscription> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("This browser cannot receive notifications.");
  }
  if (isIOS() && !isStandalone()) {
    throw new Error("Add PingLoop to your home screen first, then start it there.");
  }
  if (Notification.permission !== "granted") {
    throw new Error("Allow notifications so PingLoop can reach you.");
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
}

async function request<T>(method: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API}/schedule`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the ping server. Check your connection.");
  }
  if (!response.ok) {
    throw new Error(`The ping server said ${response.status}.`);
  }
  return (await response.json()) as T;
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
