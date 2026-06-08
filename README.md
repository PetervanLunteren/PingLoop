<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/pingloop-wide-dark.svg" />
    <img src="public/pingloop-wide-light.svg" alt="PingLoop" width="640" />
  </picture>
</p>

<p align="center">
  <a href="https://petervanlunteren.github.io/PingLoop/">https://petervanlunteren.github.io/PingLoop/</a>
</p>

A simple, focused countdown timer that runs in your browser. The timer itself
needs no backend, your settings stay on your device, and it works offline after
the first load. An optional push backend can be deployed so alerts also arrive
when the app is closed (see Background alerts).

PingLoop is built with Vite, React, and TypeScript, and ships as a static site
you can host on GitHub Pages.

## What it does

One timer, in the spirit of a physical Pomodoro cube: pick a length, toggle it
on, and it counts down. When it reaches zero it plays a sound and shows a
notification.

- Pick a length: 5, 10, 15, 30, or 60 minutes.
- One on/off toggle to start and stop.
- A ring that empties as time runs down.
- A repeat switch: when on, the timer restarts itself after each ping.
- Your last used length and repeat setting are remembered for next time.

## Local development

Requires Node 18 or newer.

```bash
npm install
npm run dev
```

Open the URL that Vite prints. Other useful scripts:

```bash
npm run test        # run the logic tests once
npm run test:watch  # watch mode
npm run typecheck   # type-check without building
npm run build       # type-check and build to dist/
npm run preview     # serve the production build locally
```

## How notifications work, and what they cannot do

This is the honest part.

Without the optional backend, PingLoop can only act while it is open. A static
site cannot reliably wake itself after it is closed, and PingLoop does not
pretend otherwise.

- The timer runs from a loop while the app is open in a tab or as an installed
  app. Close it, and it stops.
- The end time is absolute, so the countdown survives a reload. If the timer was
  due while the tab was asleep, it fires when you reopen the app.
- On iPhone and iPad, browser tabs cannot show notifications at all. You must
  add PingLoop to the home screen and use iOS 16.4 or later.
- If your device sleeps or the browser suspends the tab, the alert can be late.

With the optional backend (see Background alerts), a server sends a push at the
end time, so the alert can arrive with the app closed. This is still best-effort:
push services can defer delivery, the cron runs once a minute so the alert can be
up to about a minute late, and it is not a replacement for the native Clock alarm.

The sound plays while the app is open even if notifications are blocked. Open the
bell button in the top left to turn notifications on, send a test ping, and read
how to add PingLoop to your home screen. The bell shows a dot while notifications
are off.

## Install as an app (PWA)

PingLoop is a progressive web app. In a supporting browser you can install it:

- Desktop Chrome or Edge: use the install icon in the address bar.
- Android Chrome: menu, then "Add to Home screen".
- iPhone or iPad Safari: share button, then "Add to Home Screen".

Once installed it opens in its own window and keeps working offline.

## Deploy to GitHub Pages

Deployment is automated with GitHub Actions in
`.github/workflows/deploy.yml`. On every push to `main` it builds the site and
publishes `dist/` to Pages.

One-time setup:

1. Push this repository to GitHub with the default branch named `main`.
2. In the repository, open **Settings > Pages** and set **Source** to
   **GitHub Actions**.
3. Push to `main`. The workflow builds and deploys, and the Pages URL appears in
   the workflow summary.

### The base path matters

The site is served from a sub-path on GitHub Pages, so `base` in
`vite.config.ts` must match the repository name. It is set to:

```ts
const base = "/PingLoop/";
```

If you rename the repository, or use a user/org page or a custom domain, update
`base` to match (use `"/"` for a custom domain or a `<user>.github.io`
repository). The manifest `start_url` and `scope` follow `base` automatically.

## Background alerts (optional)

By default PingLoop is a foreground-only timer with no backend. If you want the
alert to arrive with the app closed, deploy the small Cloudflare Worker in
[`server/`](server/) and point the frontend at it. Full steps are in
[`server/README.md`](server/README.md); in short:

1. Generate a VAPID key pair: `npx web-push generate-vapid-keys`.
2. In `server/`, create a D1 database, run the migration, set the private key as
   a secret, set the public key and your origin in `wrangler.toml`, and
   `wrangler deploy`.
3. Set the frontend build to point at the Worker by adding the repo variables
   `VITE_PUSH_API` (the Worker URL) and `VITE_VAPID_PUBLIC_KEY`, then redeploy.

What this means, stated plainly:

- It is no longer "GitHub Pages only". You run and maintain a Worker, a D1
  database, and a VAPID secret.
- Data leaves the device. Once notifications are on, every started timer sends
  its push subscription (a device-specific endpoint and keys) and the next fire
  time to your Worker. They are deleted when the timer is cancelled, when it
  finishes in the foreground, or when the subscription expires. Nothing else is
  stored.
- It is best-effort, not a guaranteed alarm. See the notifications section above.
- iOS still requires the installed PWA on iOS 16.4 or later.

If you do not set the two variables, the build simply leaves background alerts
off and PingLoop behaves exactly as the foreground-only timer.

## App icons

The icons are generated from the full-bleed brand mark
`public/pingloop-icon-fullbleed.svg` by `@vite-pwa/assets-generator`. Full-bleed
means the gradient fills the whole square with no padding, so the platform
rounds the corners itself and the installed icon has no white frame. The
generated PNGs are committed so the build does not depend on regenerating them.
If you change the mark, regenerate them:

```bash
npm run generate-icons
```

## Project structure

```
src/
  types.ts          the TimerState type
  timer.ts          pure timer-state transitions
  format.ts         countdown formatting
  storage.ts        localStorage load and save
  notify.ts         Web Notifications API wrapper and support detection
  sound.ts          Web Audio API beep
  push.ts           background push client (no-op without a backend)
  sw.ts             service worker: offline precache + push handler
  state.tsx         reducer, persistence, finish loop, push scheduling
  App.tsx           layout, header bell, and dialog wiring
  components/       Timer, notification bell and dialog, error boundary
  timer.test.ts     Vitest tests for the pure logic
server/             optional Cloudflare Worker for background push
```

The logic lives in small, pure, dependency-free modules so it is easy to read
and test. The React components are thin views over a single store.

## Limitations and non-goals

- Background alerts are best-effort, not a guaranteed alarm, and need the
  optional backend. Without it, PingLoop only alerts while open.
- No accounts and no sync. The timer setting is stored per browser in
  `localStorage`. With background alerts on, a push subscription and the next
  fire time are stored on your Worker until cancelled or expired.

## License

MIT.
