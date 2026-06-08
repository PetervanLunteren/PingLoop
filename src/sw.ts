/// <reference lib="webworker" />
// PingLoop service worker. Two jobs: keep the app working offline (Workbox
// precache, injected by vite-plugin-pwa), and show the background push that the
// Cloudflare Worker sends when a timer ends with the app closed.

import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event) => {
  event.waitUntil(handlePush(event));
});

async function handlePush(event: PushEvent): Promise<void> {
  const { title, body } = readPushData(event);

  // If a window is open and visible, the in-app loop already alerts the user
  // (with sound), so showing the push too would be a duplicate. Skip it then.
  const windows = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  if (windows.some((client) => client.visibilityState === "visible")) return;

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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(focusApp());
});

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
