import { v } from "convex/values";
import { mutation, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireToken } from "./auth";
import { restRequest } from "../shared/push";
export const configure = mutation({
  args: { token: v.string(), input: v.any() },
  handler: async (ctx, { token, input }) => {
    requireToken(token);
    const p = restRequest.parse(input);
    const device = await ctx.db
      .query("restDevices")
      .withIndex("by_device", (q) => q.eq("deviceId", p.deviceId))
      .unique();
    if (p.action === "subscribe") {
      const data = {
        deviceId: p.deviceId,
        endpoint: p.subscription.endpoint,
        ...p.subscription.keys,
        updatedAt: Date.now(),
      };
      if (device) await ctx.db.patch(device._id, data);
      else await ctx.db.insert("restDevices", data);
      return { enabled: true };
    }
    if (!device) return { enabled: false };
    if (device.scheduledId) {
      const scheduled = await ctx.db.system.get(device.scheduledId);
      if (scheduled?.state.kind === "pending")
        await ctx.scheduler.cancel(device.scheduledId);
    }
    if (p.action === "cancel") {
      await ctx.db.patch(device._id, {
        endsAt: undefined,
        version: undefined,
        scheduledId: undefined,
      });
      return { enabled: true };
    }
    if (p.endsAt < Date.now() || p.endsAt > Date.now() + 30 * 60_000)
      throw new Error("Invalid timer deadline");
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY)
      throw new Error("Notifications not configured");
    const scheduledId = await ctx.scheduler.runAt(
      p.endsAt,
      internal.restPush.send,
      { id: device._id, version: p.version },
    );
    await ctx.db.patch(device._id, {
      endsAt: p.endsAt,
      version: p.version,
      scheduledId,
      updatedAt: Date.now(),
    });
    return { enabled: true };
  },
});
export const pending = internalQuery({
  args: { id: v.id("restDevices"), version: v.string() },
  handler: async (ctx, p) => {
    const d = await ctx.db.get(p.id);
    return d &&
      d.version === p.version &&
      d.endsAt &&
      d.endsAt <= Date.now() &&
      Date.now() - d.endsAt < 60_000
      ? d
      : null;
  },
});
export const expire = internalMutation({
  args: { id: v.id("restDevices"), version: v.string(), endpoint: v.string() },
  handler: async (ctx, p) => {
    const d = await ctx.db.get(p.id);
    if (d?.version === p.version && d.endpoint === p.endpoint)
      await ctx.db.delete(p.id);
  },
});
