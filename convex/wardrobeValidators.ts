import { v } from "convex/values";
export const wardrobeOwner = v.union(v.literal("max"), v.literal("zhanel"));
export const wardrobeView = v.union(
  v.literal("front"),
  v.literal("side"),
  v.literal("back"),
  v.literal("detail"),
  v.literal("source"),
);
export const wardrobeImage = v.object({
  view: wardrobeView,
  storageId: v.id("_storage"),
});

export const wardrobeWeek = {
  owner: wardrobeOwner,
  weekOf: v.string(),
  city: v.string(),
  forecastIssued: v.string(),
  forecastUrl: v.string(),
  looks: v.array(v.object({
    title: v.string(),
    high: v.number(),
    nightLow: v.number(),
    weather: v.string(),
    why: v.string(),
    items: v.array(v.id("wardrobeItems")),
    image: v.id("_storage"),
  })),
};
