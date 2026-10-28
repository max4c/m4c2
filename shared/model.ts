import { z } from "zod";
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (x) =>
      !Number.isNaN(Date.parse(x)) &&
      new Date(x).toISOString().slice(0, 10) === x,
    "Use a real YYYY-MM-DD date",
  );
export const nonnegative = z.number().finite().min(0);
export const setSchema = z.object({
  w: nonnegative.max(2000),
  r: z.number().int().min(1).max(1000),
});
export const exerciseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sets: z.array(setSchema).max(30),
});
export const rotationSchema = z.enum(["push", "pull", "upper"]);
export const planExerciseSchema = z.object({
  name: z.string().min(1).max(120),
  sets: z.number().int().min(1).max(20),
  mode: z.enum(["weighted", "bodyweight", "timed", "carry"]),
});
export const targetsSchema = z.object({
  protein: nonnegative.max(500),
  calories: nonnegative.max(10000).nullable(),
  liftsMin: z.number().int().min(1).max(7),
  liftsMax: z.number().int().min(1).max(7),
  movementDays: z.number().int().min(1).max(7),
  setsMin: z.number().int().min(1).max(50),
  setsMax: z.number().int().min(1).max(50),
});
export const planSchema = z
  .object({
    program: z.object({
      push: z.array(planExerciseSchema).min(1),
      pull: z.array(planExerciseSchema).min(1),
      upper: z.array(planExerciseSchema).min(1),
      legs: z.array(planExerciseSchema).min(1),
    }),
    rationale: z.string().min(1).max(10000),
    targets: targetsSchema,
    timezone: z.string().refine((t) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: t });
        return true;
      } catch {
        return false;
      }
    }, "Invalid IANA timezone"),
    bedtimeHour: z.number().int().min(0).max(23),
  })
  .refine(
    (p) =>
      p.targets.liftsMin <= p.targets.liftsMax &&
      p.targets.setsMin <= p.targets.setsMax,
    "Target minimum must not exceed maximum",
  );
export type Plan = z.infer<typeof planSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Workout = {
  date: string;
  ts: number;
  kind: "lift" | "cardio";
  label: string;
  intensity: "easy" | "hard";
  exercises: Exercise[];
};
const e = (
  name: string,
  sets: number,
  mode: "weighted" | "bodyweight" | "timed" | "carry" = "weighted",
) => ({ name, sets, mode });
export const seedPlan: Plan = {
  program: {
    push: [
      e("Cable overhead triceps extension", 4),
      e("Dips", 3, "bodyweight"),
      e("Overhead press", 3),
      e("Lateral raises", 3),
      e("Incline DB press", 3),
    ],
    pull: [
      e("Incline DB curl", 4),
      e("Hammer curl", 3),
      e("Rear delt fly", 3),
      e("Reverse curl", 3),
      e("Pull-ups", 3, "bodyweight"),
      e("Dead hangs", 2, "timed"),
    ],
    upper: [
      e("Lateral raises", 3),
      e("Preacher curl", 3),
      e("Triceps pushdown", 3),
      e("Overhead press", 3),
      e("Pull-ups", 3, "bodyweight"),
      e("Farmer carries", 2, "carry"),
    ],
    legs: [e("Squat", 3), e("Hamstring curl", 3), e("Adductor", 3)],
  },
  rationale:
    "Upper-emphasis PPL because legs are covered by daily cardio and sport while arms/shoulders lag from years of compounds; double progression 8–12 for hypertrophy; 10–15 hard sets/week for arms and shoulders, chest/back at maintenance; cardio 80/20 easy-to-hard building a base for a rim-to-rim hike in late May; 150g protein/day, consistent daily calories; ~5:30am easy jogs, afternoon lifts fed; 9pm sleep is the anchor.",
  targets: {
    protein: 150,
    calories: null,
    liftsMin: 4,
    liftsMax: 5,
    movementDays: 6,
    setsMin: 10,
    setsMax: 15,
  },
  timezone: "America/Los_Angeles",
  bedtimeHour: 21,
};
export const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]/g, "");
export function todayAt(ts: number, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ts);
}
export function addDays(date: string, n: number) {
  return new Date(Date.parse(date + "T12:00:00Z") + n * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}
export function periodStart(date: string, period: "day" | "week" | "month") {
  if (period === "day") return date;
  if (period === "month") return date.slice(0, 7) + "-01";
  return addDays(date, -((new Date(date + "T12:00:00Z").getUTCDay() + 6) % 7));
}
export const nextRotation = (r: "push" | "pull" | "upper") =>
  (({ push: "pull", pull: "upper", upper: "push" }) as const)[r];
export function rotationLabel(label: string) {
  return rotationSchema.safeParse(label.trim().toLowerCase());
}
export function validRotation(w: Workout) {
  return (
    w.kind === "lift" &&
    rotationLabel(w.label).success &&
    w.exercises.some((e) => e.sets.length > 0)
  );
}
export function muscle(
  name: string,
): "biceps" | "triceps" | "shoulders" | "chest" | "back" | "legs" | "unmapped" {
  const n = normalize(name);
  if (/hamstring|adductor|squat|legpress|lunge|calf|deadlift/.test(n))
    return "legs";
  if (/triceps|pushdown|dip/.test(n)) return "triceps";
  if (/curl/.test(n)) return "biceps";
  if (/lateral|reardelt|overheadpress|shoulderpress/.test(n))
    return "shoulders";
  if (/chest|incline.*press|benchpress|pushup/.test(n)) return "chest";
  if (/pullup|chinup|row|pulldown/.test(n)) return "back";
  return "unmapped";
}
