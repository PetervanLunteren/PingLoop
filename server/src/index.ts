// PingLoop push backend, and the timer itself. Two entry points:
//   fetch     - the app reads, starts and stops the single schedule.
//   scheduled - a once-a-minute cron sends the ping that is due.
//
// There is exactly one schedule (the database enforces it), the worker decides
// every ping time, and the push notification is the only alert. The app never
// notifies and never keeps its own clock.

import type { Env } from "./env";
import { sendPush, PUSH_TTL_SECONDS } from "./push";
import { nextFireAt, parseScheduleInput, type ScheduleInput } from "./schedule";
import { pickSuggestion } from "./suggestions";

/** A run keeps pinging for this long, then stops on its own. */
const RUN_MS = 8 * 60 * 60 * 1000;
/** Give up on a subscription after this many failed sends in a row. */
const MAX_ATTEMPTS = 3;
const TITLE = "Time for a break";

interface ScheduleRow {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  fire_at: number;
  interval_ms: number;
  until: number;
  attempts: number;
}

/** What the app sees. Ping times are derived from this same grid. */
interface SchedulePublic {
  fireAt: number;
  intervalMs: number;
  until: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }
    if (pathname === "/schedule") {
      if (request.method === "GET") return handleGet(env);
      if (request.method === "POST") return handlePost(request, env);
      if (request.method === "DELETE") return handleDelete(env);
    }
    return json(env, { error: "not found" }, 404);
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const now = Date.now();
    const due = await env.DB.prepare("SELECT * FROM schedule WHERE fire_at <= ?")
      .bind(now)
      .first<ScheduleRow>();
    console.log(`cron ${iso(now)} due=${due ? 1 : 0}`);
    if (due) await firePing(due, env, now);
  },
};

async function handleGet(env: Env): Promise<Response> {
  const row = await env.DB.prepare("SELECT * FROM schedule WHERE id = 1").first<ScheduleRow>();
  return json(env, row ? publicView(row) : null, 200);
}

/** Start a run. The worker sets the ping times; the app only picks the interval. */
async function handlePost(request: Request, env: Env): Promise<Response> {
  let input: ScheduleInput;
  try {
    input = parseScheduleInput(await request.json());
  } catch (err) {
    return json(env, { error: String(err instanceof Error ? err.message : err) }, 400);
  }

  const now = Date.now();
  const schedule: SchedulePublic = {
    fireAt: now + input.intervalMs,
    intervalMs: input.intervalMs,
    until: now + RUN_MS,
  };

  // id is always 1, so this replaces any existing run. No orphans, ever.
  await env.DB.prepare(
    `INSERT OR REPLACE INTO schedule
       (id, endpoint, p256dh, auth, fire_at, interval_ms, until, attempts)
     VALUES (1, ?, ?, ?, ?, ?, ?, 0)`,
  )
    .bind(
      input.subscription.endpoint,
      input.subscription.keys.p256dh,
      input.subscription.keys.auth,
      schedule.fireAt,
      schedule.intervalMs,
      schedule.until,
    )
    .run();

  console.log(`start interval=${schedule.intervalMs}ms first=${iso(schedule.fireAt)} until=${iso(schedule.until)}`);
  return json(env, schedule, 200);
}

async function handleDelete(env: Env): Promise<Response> {
  await env.DB.prepare("DELETE FROM schedule").run();
  console.log("stop");
  return json(env, { ok: true }, 200);
}

/** Send the due ping, then move to the next slot, or end the run. */
async function firePing(row: ScheduleRow, env: Env, now: number): Promise<void> {
  const subscription = {
    endpoint: row.endpoint,
    expirationTime: null,
    keys: { p256dh: row.p256dh, auth: row.auth },
  };
  const data = { title: TITLE, body: pickSuggestion() };

  let status: number;
  try {
    status = await sendPush(subscription, data, env);
  } catch (err) {
    status = 0; // network error, treat as a transient failure
    console.log(`  send ERROR host=${hostOf(row.endpoint)} err=${String(err)}`);
  }
  console.log(
    `  send host=${hostOf(row.endpoint)} status=${status} for=${iso(row.fire_at)}` +
      ` late=${Math.round((now - row.fire_at) / 1000)}s ttl=${PUSH_TTL_SECONDS}s body="${data.body}"`,
  );

  const sent = status >= 200 && status < 300;
  const gone = status === 404 || status === 410;

  if (sent) {
    const next = nextFireAt(row.fire_at, row.interval_ms, now);
    if (next > row.until) {
      await clearSchedule(env);
      console.log("  -> run finished");
      return;
    }
    await env.DB.prepare("UPDATE schedule SET fire_at = ?, attempts = 0 WHERE id = 1")
      .bind(next)
      .run();
    console.log(`  -> next ${iso(next)}`);
    return;
  }

  if (gone || row.attempts + 1 >= MAX_ATTEMPTS) {
    await clearSchedule(env);
    console.log(`  -> removed (${gone ? "subscription gone" : "gave up"})`);
    return;
  }

  // Transient failure: leave fire_at so the next cron retries.
  await env.DB.prepare("UPDATE schedule SET attempts = attempts + 1 WHERE id = 1").run();
  console.log(`  -> transient, will retry (attempt ${row.attempts + 1})`);
}

function clearSchedule(env: Env): Promise<unknown> {
  return env.DB.prepare("DELETE FROM schedule").run();
}

function publicView(row: ScheduleRow): SchedulePublic {
  return { fireAt: row.fire_at, intervalMs: row.interval_ms, until: row.until };
}

/** Short UTC time for logs, e.g. 13:16:20. */
function iso(ms: number): string {
  return new Date(ms).toISOString().slice(11, 19);
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "unknown";
  }
}

function corsHeaders(env: Env): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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
