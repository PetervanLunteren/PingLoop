// Pure schedule logic: input validation and repeat rescheduling. No Cloudflare
// or crypto APIs here, so it is easy to unit-test.

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export interface PushKeys {
  p256dh: string;
  auth: string;
}

export interface Subscription {
  endpoint: string;
  expirationTime: number | null;
  keys: PushKeys;
}

export interface ScheduleInput {
  subscription: Subscription;
  fireAt: number;
  title: string;
  body: string;
  repeat: boolean;
  intervalMs: number;
}

/**
 * Validate and narrow an untrusted request body. Throws loudly with a clear
 * message on anything unexpected; the caller turns that into a 400.
 */
export function parseScheduleInput(value: unknown): ScheduleInput {
  const root = asObject(value, "body");
  const subscription = asObject(root.subscription, "subscription");
  const endpoint = asString(subscription.endpoint, "subscription.endpoint");
  if (!endpoint.startsWith("https://")) {
    throw new Error("subscription.endpoint must be an https URL");
  }
  const keys = asObject(subscription.keys, "subscription.keys");
  const p256dh = asString(keys.p256dh, "subscription.keys.p256dh");
  const auth = asString(keys.auth, "subscription.keys.auth");

  const fireAt = asFiniteNumber(root.fireAt, "fireAt");
  if (fireAt <= 0) throw new Error("fireAt must be a positive epoch ms");

  const title = asString(root.title, "title");
  if (title.length < 1 || title.length > 100) {
    throw new Error("title must be 1 to 100 characters");
  }
  const body = asString(root.body, "body");
  if (body.length > 200) throw new Error("body must be 200 characters or fewer");

  if (typeof root.repeat !== "boolean") throw new Error("repeat must be a boolean");
  const repeat = root.repeat;

  const intervalMs = asFiniteNumber(root.intervalMs, "intervalMs");
  if (repeat && (intervalMs < MINUTE_MS || intervalMs > DAY_MS)) {
    throw new Error("intervalMs must be between 1 minute and 1 day when repeat is on");
  }

  return {
    subscription: { endpoint, expirationTime: null, keys: { p256dh, auth } },
    fireAt,
    title,
    body,
    repeat,
    intervalMs,
  };
}

/**
 * The next fire time for a repeating schedule: advance by the interval until it
 * is in the future, so a brief cron delay never causes a burst of catch-up
 * pushes.
 */
export function nextFireAt(fireAt: number, intervalMs: number, now: number): number {
  let next = fireAt + intervalMs;
  while (next <= now) next += intervalMs;
  return next;
}

function asObject(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new Error(`${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, name: string): string {
  if (typeof value !== "string") throw new Error(`${name} must be a string`);
  return value;
}

function asFiniteNumber(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`);
  }
  return value;
}
