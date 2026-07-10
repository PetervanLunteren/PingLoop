import { describe, expect, it } from "vitest";
import { nextFireAt, parseScheduleInput } from "../src/schedule";

const MINUTE = 60_000;

const validSubscription = {
  endpoint: "https://web.push.apple.com/abc",
  expirationTime: null,
  keys: { p256dh: "p256dh-key", auth: "auth-key" },
};

const validBody = {
  subscription: validSubscription,
  intervalMs: 30 * MINUTE,
};

describe("nextFireAt", () => {
  it("advances one interval when the slot just passed", () => {
    expect(nextFireAt(1000, MINUTE, 1000)).toBe(1000 + MINUTE);
  });

  it("skips missed slots so a late cron never fires a burst", () => {
    // slot 1000, every minute, now is past three slots: land on the next future one.
    expect(nextFireAt(1000, MINUTE, 1000 + 3 * MINUTE)).toBe(1000 + 4 * MINUTE);
  });

  it("stays on the same grid the app derives its countdown from", () => {
    const fireAt = 1000;
    const next = nextFireAt(fireAt, MINUTE, 1000 + 5 * MINUTE + 1);
    expect((next - fireAt) % MINUTE).toBe(0);
  });
});

describe("parseScheduleInput", () => {
  it("accepts a valid body and normalises the subscription", () => {
    const parsed = parseScheduleInput(validBody);
    expect(parsed.subscription.endpoint).toBe(validSubscription.endpoint);
    expect(parsed.subscription.expirationTime).toBeNull();
    expect(parsed.intervalMs).toBe(30 * MINUTE);
  });

  it.each([
    ["non-object body", 42],
    ["missing subscription", { ...validBody, subscription: undefined }],
    ["http endpoint", { ...validBody, subscription: { ...validSubscription, endpoint: "http://x" } }],
    ["missing keys", { ...validBody, subscription: { endpoint: validSubscription.endpoint } }],
    ["interval not a number", { ...validBody, intervalMs: "thirty" }],
    ["interval below a minute", { ...validBody, intervalMs: 30_000 }],
    ["interval above a day", { ...validBody, intervalMs: 25 * 60 * MINUTE }],
  ])("rejects %s", (_label, body) => {
    expect(() => parseScheduleInput(body)).toThrow();
  });
});
