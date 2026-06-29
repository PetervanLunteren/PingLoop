import { describe, expect, it } from "vitest";
import { nextFireAt, parseScheduleInput, pushTtlSeconds } from "../src/schedule";

const validSubscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  expirationTime: null,
  keys: { p256dh: "p256dh-key", auth: "auth-key" },
};

const validBody = {
  subscription: validSubscription,
  fireAt: 1000,
  title: "Timer finished",
  body: "Your countdown is done.",
  repeat: false,
  intervalMs: 0,
  repeatUntil: null,
};

describe("pushTtlSeconds", () => {
  it("keeps a repeat push valid for about one cycle, bounded 1 min to 1 hour", () => {
    expect(pushTtlSeconds(30 * 60_000, true)).toBe(1800); // 30 min interval
    expect(pushTtlSeconds(60_000, true)).toBe(60); // 1 min interval
    expect(pushTtlSeconds(2 * 3600_000, true)).toBe(3600); // capped at 1 hour
  });

  it("gives a one-shot a wide window (30 min to 6 hours)", () => {
    expect(pushTtlSeconds(5 * 60_000, false)).toBe(1800); // short timer floored to 30 min
    expect(pushTtlSeconds(45 * 60_000, false)).toBe(2700); // 45 min
    expect(pushTtlSeconds(10 * 3600_000, false)).toBe(21600); // capped at 6 hours
  });

  it("is much longer than the old fixed 60s, so idle phones still get the push", () => {
    expect(pushTtlSeconds(30 * 60_000, true)).toBeGreaterThan(60);
    expect(pushTtlSeconds(30 * 60_000, false)).toBeGreaterThan(60);
  });
});

describe("nextFireAt", () => {
  it("advances by one interval when the fire time just passed", () => {
    expect(nextFireAt(1000, 60_000, 1000)).toBe(61_000);
  });

  it("skips missed intervals so it never bursts", () => {
    // fireAt 1000, interval 60s, now 200000 -> first future slot is 241000.
    expect(nextFireAt(1000, 60_000, 200_000)).toBe(241_000);
  });
});

describe("parseScheduleInput", () => {
  it("accepts a valid body and normalises the subscription", () => {
    const parsed = parseScheduleInput(validBody);
    expect(parsed.subscription.endpoint).toBe(validSubscription.endpoint);
    expect(parsed.subscription.expirationTime).toBeNull();
    expect(parsed.repeat).toBe(false);
  });

  it("accepts a repeating schedule with a valid interval", () => {
    const parsed = parseScheduleInput({ ...validBody, repeat: true, intervalMs: 300_000 });
    expect(parsed.repeat).toBe(true);
    expect(parsed.intervalMs).toBe(300_000);
  });

  it("reads repeatUntil as a number, or null when absent", () => {
    expect(
      parseScheduleInput({ ...validBody, repeat: true, intervalMs: 300_000, repeatUntil: 99_999 })
        .repeatUntil,
    ).toBe(99_999);
    expect(parseScheduleInput({ ...validBody, repeatUntil: undefined }).repeatUntil).toBeNull();
    expect(parseScheduleInput(validBody).repeatUntil).toBeNull();
  });

  it.each([
    ["non-object body", 42],
    ["missing subscription", { ...validBody, subscription: undefined }],
    ["http endpoint", { ...validBody, subscription: { ...validSubscription, endpoint: "http://x" } }],
    ["missing keys", { ...validBody, subscription: { endpoint: validSubscription.endpoint } }],
    ["fireAt not a number", { ...validBody, fireAt: "soon" }],
    ["fireAt not positive", { ...validBody, fireAt: 0 }],
    ["empty title", { ...validBody, title: "" }],
    ["overlong body", { ...validBody, body: "x".repeat(201) }],
    ["repeat not boolean", { ...validBody, repeat: "yes" }],
    ["repeat with tiny interval", { ...validBody, repeat: true, intervalMs: 1000 }],
  ])("rejects %s", (_label, body) => {
    expect(() => parseScheduleInput(body)).toThrow();
  });
});
