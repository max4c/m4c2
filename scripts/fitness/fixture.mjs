// Synthetic data for an isolated, anonymous LOCAL deployment only.
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .trim()
    .split("\n")
    .map((x) => {
      const i = x.indexOf("=");
      return [x.slice(0, i), x.slice(i + 1)];
    }),
);
if (new URL(env.CONVEX_URL).hostname !== "127.0.0.1")
  throw new Error("Fixture refuses nonlocal deployment");
const db = new ConvexHttpClient(env.CONVEX_URL),
  token = env.CONVEX_SERVICE_TOKEN;
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format();
const date = (n) =>
  new Date(Date.parse(today + "T12:00:00Z") + n * 86400000)
    .toISOString()
    .slice(0, 10);
for (let i = -55; i < 0; i++) {
  const d = date(i),
    ts = Date.parse(d + "T19:00:00Z");
  await db.mutation(api.fitness.log, {
    token,
    operation: "log_meal",
    input: {
      date: d,
      ts,
      name: [
        "Salmon, rice & greens",
        "Chicken grain bowl",
        "Greek yogurt & berries",
      ][Math.abs(i) % 3],
      calories: 2100 + (i % 5) * 70,
      protein: 155 + (i % 7) * 5,
      carbs: 210,
      fat: 65,
      quality: 8,
      note: "Synthetic local test data: daily intake represented as one row.",
      requestId: `fixture-meal-${d}`,
    },
  });
  if (i % 3 === 0)
    await db.mutation(api.fitness.log, {
      token,
      operation: "log_weight",
      input: {
        date: d,
        ts,
        lbs: Math.round((172 - i * 0.04 + Math.sin(i) * 0.4) * 10) / 10,
        requestId: `fixture-weight-${d}`,
      },
    });
  await db.mutation(api.fitness.log, {
    token,
    operation: "log_steps",
    input: {
      date: d,
      count: Math.abs(i) % 7 === 0 ? 0 : 5500 + Math.abs(i % 5) * 900,
    },
  });
  if (i % 2 === 0)
    await db.mutation(api.fitness.log, {
      token,
      operation: "log_workout",
      input: {
        date: d,
        ts,
        label: ["Push", "Pull", "Upper"][Math.abs(i) % 3],
        kind: "lift",
        intensity: "hard",
        exercises: [
          {
            name: "Lateral raises",
            sets: [
              { w: 20, r: 12 },
              { w: 20, r: 12 },
              { w: 20, r: 11 },
            ],
          },
          {
            name: "Incline DB curl",
            sets: [
              { w: 30, r: 10 },
              { w: 30, r: 10 },
              { w: 30, r: 9 },
            ],
          },
        ],
        requestId: `fixture-lift-${d}`,
      },
    });
}
for (let i = -2; i <= 0; i++)
  await db.mutation(api.fitness.log, {
    token,
    operation: "log_measurements",
    input: {
      date: date(i * 25),
      ts: Date.parse(date(i * 25) + "T19:00:00Z"),
      arm: 14.5 + i * 0.1,
      shoulders: 46 + i * 0.2,
      chest: 40.5 + i * 0.1,
      waist: 32 - i * 0.15,
      requestId: `fixture-tape-${i}`,
    },
  });
console.log("Synthetic local fixture loaded; no cloud data touched.");
