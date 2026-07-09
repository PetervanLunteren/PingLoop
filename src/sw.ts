/// <reference lib="webworker" />
// PingLoop service worker. Two jobs: keep the app working offline (Workbox
// precache, injected by vite-plugin-pwa), and show the background push that the
// Cloudflare Worker sends when a timer ends with the app closed.

import { precacheAndRoute } from "workbox-precaching";

type PrecacheEntry = string | { url: string; revision: string | null };

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: PrecacheEntry[];
};

// Register the push handlers first, before anything that could throw, so they
// are always active even if precaching has an issue.
self.addEventListener("push", (event) => {
  event.waitUntil(handlePush(event));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(focusApp());
});

self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// vite-plugin-pwa can list the same URL (the web manifest) twice with different
// revisions, which makes precacheAndRoute throw. Dedupe by URL first.
const seen = new Set<string>();
const manifest = self.__WB_MANIFEST.filter((entry) => {
  const url = typeof entry === "string" ? entry : entry.url;
  if (seen.has(url)) return false;
  seen.add(url);
  return true;
});
precacheAndRoute(manifest);

async function handlePush(event: PushEvent): Promise<void> {
  const { title, body } = readPushData(event);

  // Always show something. A push that shows no notification breaks the
  // userVisibleOnly promise we made when subscribing, and iOS answers that by
  // throttling or dropping later pushes. The app therefore stays quiet and lets
  // this be the only notifier.
  await self.registration.showNotification(title, {
    body,
    icon: "pwa-192x192.png",
    badge: "pwa-192x192.png",
  });
}

function readPushData(event: PushEvent): { title: string; body: string } {
  try {
    const data = event.data?.json();
    if (data && typeof data.title === "string" && typeof data.body === "string") {
      return { title: data.title, body: data.body };
    }
  } catch {
    // Fall through to a safe default.
  }
  return { title: "PingLoop", body: "Your timer finished." };
}

async function focusApp(): Promise<void> {
  const windows = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  const existing = windows[0];
  if (existing) {
    await existing.focus();
    return;
  }
  await self.clients.openWindow(self.registration.scope);
}
