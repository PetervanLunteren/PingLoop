// The only crypto-touching file. Sends one encrypted Web Push using a
// WebCrypto-based library (the Node `web-push` package does not run on Workers).

import {
  buildPushPayload,
  type PushSubscription,
  type VapidKeys,
} from "@block65/webcrypto-web-push";
import type { Env } from "./env";

export interface PushData {
  title: string;
  body: string;
}

/** Returns the push service HTTP status (201 on success, 404/410 if gone). */
export async function sendPush(
  subscription: PushSubscription,
  data: PushData,
  ttlSeconds: number,
  env: Env,
): Promise<number> {
  const vapid: VapidKeys = {
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  };
  // High urgency asks for prompt delivery; the TTL keeps the push alive long
  // enough that an idle phone still gets it when it next checks in.
  const payload = await buildPushPayload(
    { data: JSON.stringify(data), options: { ttl: ttlSeconds, urgency: "high" } },
    subscription,
    vapid,
  );
  const response = await fetch(subscription.endpoint, payload);
  return response.status;
}
