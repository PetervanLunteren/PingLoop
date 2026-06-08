import { describe, expect, it } from "vitest";
import { nextFireAt, parseScheduleInput } from "../src/schedule";

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
};

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
