"use node";
import { v } from "convex/values";
import webpush from "web-push";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
export const send = internalAction({
  args: { id: v.id("restDevices"), version: v.string() },
  handler: async (ctx, p) => {
    const d = await ctx.runQuery(internal.rest.pending, p);
    if (!d) return;
    try {
      await webpush.sendNotification(
        { endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } },
        JSON.stringify({ endsAt: d.endsAt, version: p.version }),
        {
          vapidDetails: {
            subject: "mailto:signal@maxforsey.com",
            publicKey: process.env.VAPID_PUBLIC_KEY!,
            privateKey: process.env.VAPID_PRIVATE_KEY!,
          },
          TTL: 30,
          urgency: "high",
          timeout: 10_000,
        },
      );
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410)
        await ctx.runMutation(internal.rest.expire, {
          ...p,
          endpoint: d.endpoint,
        });
      // Never log a subscription endpoint or encryption keys.
      else
        throw new Error(
          `Rest notification delivery failed (${status ?? "network"})`,
        );
    }
  },
});
