<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/pingloop-wide-dark.svg" />
    <img src="public/pingloop-wide-light.svg" alt="PingLoop" width="640" />
  </picture>
</p>

A simple, focused countdown timer that runs fully in your browser. No backend,
no account, no database. Your settings stay on your device, and the app works
offline after the first load.

PingLoop is built with Vite, React, and TypeScript, and ships as a static site
you can host on GitHub Pages.

## What it does

One timer, in the spirit of a physical Pomodoro cube: pick a length, toggle it
on, and it counts down. When it reaches zero it plays a sound and shows a
notification.

- Pick a length: 5, 10, 15, 30, or 60 minutes.
- One on/off toggle to start and stop.
- A ring that empties as time runs down.
- Your last used length is remembered for next time.

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

This is the honest part. PingLoop has no server, so it can only act while it is
open. There is no way for a static site to reliably wake itself up after it is
closed, and PingLoop does not pretend otherwise.

- The timer runs from a loop while the app is open in a tab or as an installed
  app. Close it, and it stops.
- The end time is absolute, so the countdown survives a reload. If the timer was
  due while the tab was asleep, it fires when you reopen the app.
- Install PingLoop to your home screen or desktop for the best chance of the
  alert arriving, since installed apps are kept alive longer than tabs.
- On iPhone and iPad, browser tabs cannot show notifications at all. You must
  add PingLoop to the home screen and use iOS 16.4 or later. Even then, the
  system may delay or drop notifications.
- If your device sleeps or the browser suspends the tab, the alert can be late.

The sound plays while the app is open even if notifications are blocked. The
notifications card only appears while notifications are off, and it has a test
ping button so you can confirm your setup before it disappears.

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

## App icons

The icons are generated from the brand mark `public/pingloop-icon.svg` by
`@vite-pwa/assets-generator`. The generated PNGs are committed so the build does
not depend on regenerating them. If you change the mark, regenerate them:

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
  state.tsx         reducer, persistence, and the finish loop
  App.tsx           layout
  components/       Timer, notification setup, error boundary
  timer.test.ts     Vitest tests for the pure logic
```

The logic lives in small, pure, dependency-free modules so it is easy to read
and test. The React components are thin views over a single store.

## Limitations and non-goals

- No guaranteed background notifications. There is no push server.
- No accounts and no sync. The setting is stored per browser in `localStorage`,
  so it does not move between devices or browsers.

## License

MIT.
