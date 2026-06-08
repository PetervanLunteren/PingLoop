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
  env: Env,
): Promise<number> {
  const vapid: VapidKeys = {
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  };
  // ttl 60s: a timer alert that could not be delivered within a minute is stale,
  // so let it expire rather than arrive much later.
  const payload = await buildPushPayload(
    { data: JSON.stringify(data), options: { ttl: 60, urgency: "high" } },
    subscription,
    vapid,
  );
  const response = await fetch(subscription.endpoint, payload);
  return response.status;
}
