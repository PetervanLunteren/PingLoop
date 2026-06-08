// PingLoop push backend. Two entry points:
//   fetch     - the app POSTs /schedule when a timer starts and /cancel on stop.
//   scheduled - a once-a-minute cron sends any due pushes and reschedules repeats.

import type { Env } from "./env";
import { sendPush } from "./push";
import { nextFireAt, parseScheduleInput, type ScheduleInput } from "./schedule";

const MAX_ATTEMPTS = 3;

interface ScheduleRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  fire_at: number;
  title: string;
  body: string;
  repeat: number;
  interval_ms: number;
  attempts: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }
    if (request.method === "POST" && pathname === "/schedule") {
      return handleSchedule(request, env);
    }
    if (request.method === "POST" && pathname === "/cancel") {
      return handleCancel(request, env);
    }
    return json(env, { error: "not found" }, 404);
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const now = Date.now();
    const due = await env.DB.prepare(
      "SELECT * FROM schedules WHERE fire_at <= ?",
    )
      .bind(now)
      .all<ScheduleRow>();
    await Promise.all(due.results.map((row) => fireRow(row, env, now)));
  },
};

async function handleSchedule(request: Request, env: Env): Promise<Response> {
  let input: ScheduleInput;
  try {
    input = parseScheduleInput(await request.json());
  } catch (err) {
    return json(env, { error: String(err instanceof Error ? err.message : err) }, 400);
  }

  const id = await hashEndpoint(input.subscription.endpoint);
  await env.DB.prepare(
    `INSERT INTO schedules
       (id, endpoint, p256dh, auth, fire_at, title, body, repeat, interval_ms, attempts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
     ON CONFLICT(id) DO UPDATE SET
       endpoint = excluded.endpoint, p256dh = excluded.p256dh, auth = excluded.auth,
       fire_at = excluded.fire_at, title = excluded.title, body = excluded.body,
       repeat = excluded.repeat, interval_ms = excluded.interval_ms, attempts = 0`,
  )
    .bind(
      id,
      input.subscription.endpoint,
      input.subscription.keys.p256dh,
      input.subscription.keys.auth,
      input.fireAt,
      input.title,
      input.body,
      input.repeat ? 1 : 0,
      input.intervalMs,
    )
    .run();

  return json(env, { ok: true }, 200);
}

async function handleCancel(request: Request, env: Env): Promise<Response> {
  let endpoint: unknown;
  try {
    endpoint = (await request.json<{ endpoint?: unknown }>()).endpoint;
  } catch {
    return json(env, { error: "invalid json" }, 400);
  }
  if (typeof endpoint !== "string") {
    return json(env, { error: "endpoint must be a string" }, 400);
  }
  const id = await hashEndpoint(endpoint);
  await env.DB.prepare("DELETE FROM schedules WHERE id = ?").bind(id).run();
  return json(env, { ok: true }, 200);
}

/** Send one due push and then reschedule (repeat), delete (one-shot or gone), or back off. */
async function fireRow(row: ScheduleRow, env: Env, now: number): Promise<void> {
  const subscription = {
    endpoint: row.endpoint,
    expirationTime: null,
    keys: { p256dh: row.p256dh, auth: row.auth },
  };

  let status: number;
  try {
    status = await sendPush(subscription, { title: row.title, body: row.body }, env);
  } catch (err) {
    status = 0; // network error, treat as a transient failure
    console.log(`push error host=${hostOf(row.endpoint)} err=${String(err)}`);
  }
  console.log(`push host=${hostOf(row.endpoint)} status=${status} repeat=${row.repeat}`);

  const gone = status === 404 || status === 410;
  const sent = status >= 200 && status < 300;

  if (sent && row.repeat === 1) {
    await env.DB.prepare("UPDATE schedules SET fire_at = ?, attempts = 0 WHERE id = ?")
      .bind(nextFireAt(row.fire_at, row.interval_ms, now), row.id)
      .run();
    return;
  }
  if (sent || gone || row.attempts + 1 >= MAX_ATTEMPTS) {
    await env.DB.prepare("DELETE FROM schedules WHERE id = ?").bind(row.id).run();
    return;
  }
  // Transient failure: leave fire_at so the next cron retries, bump attempts.
  await env.DB.prepare("UPDATE schedules SET attempts = attempts + 1 WHERE id = ?")
    .bind(row.id)
    .run();
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "unknown";
  }
}

async function hashEndpoint(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function corsHeaders(env: Env): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(env: Env, payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
  });
}
