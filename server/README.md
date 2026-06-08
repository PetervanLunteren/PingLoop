# PingLoop push backend

A small Cloudflare Worker that sends PingLoop's background notifications. The
app POSTs a schedule when a timer starts, and a once-a-minute cron sends any due
pushes (rescheduling repeats). It stores at most one row per device in D1.

This is optional. Without it, PingLoop is a foreground-only timer.

## What gets stored

One row per device (`id` is a hash of the push endpoint):

- the push subscription (endpoint, p256dh, auth) so a push can be sent,
- the next fire time, the notification title and body, and the repeat interval.

Rows are deleted when the app cancels (timer stopped, or it finished in the
foreground), when the push service reports the subscription is gone (404/410),
or after repeated send failures. Nothing else is stored, and there are no logs
of personal data by default.

## Deploy

Requires a Cloudflare account and Node. Wrangler 3 (pinned here) runs on Node
18+. Wrangler 4 needs Node 20+.

```bash
cd server
npm install

# 1. Generate a VAPID key pair (keep the private key secret).
npx web-push generate-vapid-keys

# 2. Create the D1 database, then paste its id into wrangler.toml (database_id).
npx wrangler d1 create pingloop

# 3. In wrangler.toml set:
#    ALLOWED_ORIGIN   the exact origin of your frontend, e.g.
#                     https://<user>.github.io
#    VAPID_SUBJECT    a mailto: or https: contact
#    VAPID_PUBLIC_KEY the public key from step 1

# 4. Store the private key as a secret (never in the repo).
npx wrangler secret put VAPID_PRIVATE_KEY

# 5. Apply the database schema.
npm run migrate:remote

# 6. Deploy.
npm run deploy
```

Then point the frontend at the Worker by setting these (non-secret) build
variables and redeploying the site:

- `VITE_PUSH_API` = your Worker URL, for example
  `https://pingloop.<your-subdomain>.workers.dev`
- `VITE_VAPID_PUBLIC_KEY` = the same public key from step 1

## Local development

```bash
npm run migrate:local   # set up the local D1
npm run dev             # wrangler dev
npm run test            # unit tests for the schedule logic
npm run typecheck
```

`wrangler dev` can trigger the cron handler on demand; see the Wrangler docs for
testing scheduled events.

## HTTP API

- `POST /schedule` body `{ subscription, fireAt, title, body, repeat, intervalMs }`
  upserts this device's schedule. `subscription` is the value from the browser's
  `PushSubscription.toJSON()`.
- `POST /cancel` body `{ endpoint }` deletes this device's schedule.

Both respond with CORS limited to `ALLOWED_ORIGIN`.

## Cost and limits

Cloudflare Workers, Cron Triggers, and D1 free tiers comfortably cover personal
and small open-source use. Check Cloudflare's current free-tier limits if you
expect many users.

## Known limitations

- Best-effort delivery. The cron is minute-grained, so an alert can be up to
  about a minute late, and push services can defer delivery.
- The endpoints are unauthenticated. Abuse is bounded because a push only ever
  reaches the subscription supplied in the request, but you may want to add a
  shared token if you expose this widely.
- Web Push from a Worker relies on a WebCrypto-based library
  (`@block65/webcrypto-web-push`), isolated in `src/push.ts`.
