import { z } from "zod";
export const pushSubscription = z.object({
  endpoint: z
    .string()
    .max(2048)
    .url()
    .refine((value) => {
      const u = new URL(value);
      return (
        u.protocol === "https:" &&
        !u.port &&
        !u.username &&
        !u.password &&
        !u.hash &&
        (u.hostname === "fcm.googleapis.com" ||
          u.hostname === "updates.push.services.mozilla.com" ||
          /^([a-z0-9-]+\.)*push\.apple\.com$/.test(u.hostname))
      );
    }, "Unsupported push provider"),
  keys: z.object({
    p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}={0,1}$/),
    auth: z.string().regex(/^[A-Za-z0-9_-]{22}={0,2}$/),
  }),
});
export const restRequest = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("subscribe"),
    deviceId: z.uuid(),
    subscription: pushSubscription,
  }),
  z.object({
    action: z.literal("start"),
    deviceId: z.uuid(),
    endsAt: z.number().int(),
    version: z.uuid(),
  }),
  z.object({ action: z.literal("cancel"), deviceId: z.uuid() }),
]);
