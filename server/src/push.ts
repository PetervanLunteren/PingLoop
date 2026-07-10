// The only crypto-touching file. Sends one encrypted Web Push using a
// WebCrypto-based library (the Node `web-push` package does not run on Workers).

import {
  buildPushPayload,
  type PushSubscription,
  type VapidKeys,
} from "@block65/webcrypto-web-push";
import type { Env } from "./env";

/**
 * How long a push stays valid at the push service. Apple queues pushes for a
 * sleeping phone and delivers them when it next checks in, so a long expiry
 * means stale pings arrive late and in clumps. Four minutes plus the one minute
 * cron means a ping lands within about five minutes of its slot, or not at all.
 */
export const PUSH_TTL_SECONDS = 240;

export interface PushData {
  title: string;
  body: string;
}

/** Returns the push service HTTP status (201 on success, 404/410 if gone). */
export async function sendPush(
  subscription: PushSubscription,
  data: PushData,
  env: Env,
): Promise<number> {
  const vapid: VapidKeys = {
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  };
  // High urgency asks Apple to deliver promptly; it is the only other knob.
  const payload = await buildPushPayload(
    { data: JSON.stringify(data), options: { ttl: PUSH_TTL_SECONDS, urgency: "high" } },
    subscription,
    vapid,
  );
  const response = await fetch(subscription.endpoint, payload);
  return response.status;
}
