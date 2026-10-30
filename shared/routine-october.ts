import type { Plan, PlanExercise } from "./model";

const lift = (
  name: string,
  sets: number,
  min: number,
  max: number,
  restSeconds: number,
  category: "isolation" | "compound",
  extra: Partial<PlanExercise> = {},
): PlanExercise => ({
  name,
  sets,
  repRange: { min, max },
  restSeconds,
  category,
  mode: "weighted",
  progression: "double",
  ...extra,
});

// The routine requested on October 30. Applied through update_plan, not on reads.
export const octoberRoutine: Pick<
  Plan,
  "program" | "rotation" | "schedule" | "rules" | "rationale"
> = {
  rotation: ["push", "pull", "upper", "legs"],
  schedule: [
    { day: "Mon", label: "Push", session: "push" },
    { day: "Tue", label: "Pull", session: "pull" },
    {
      day: "Wed",
      label: "HIIT class",
      detail: "Optional 20–30 min easy jog or incline walk.",
    },
    { day: "Thu", label: "Upper", session: "upper" },
    { day: "Fri", label: "Legs", session: "legs" },
    { day: "Sat", label: "Soccer" },
    {
      day: "Sun",
      label: "Easy jog or rest",
      detail: "30–60 min with my girlfriend, conversational pace.",
    },
  ],
  program: {
    push: [
      lift("Cable overhead triceps extension", 4, 8, 12, 90, "isolation"),
      lift("Lateral raise", 3, 12, 20, 60, "isolation", {
        aliases: ["Lateral raises"],
      }),
      lift("Weighted dips", 3, 8, 12, 120, "compound", {
        mode: "bodyweight",
        aliases: ["Dips"],
        note: "Weight is added load, not body weight.",
      }),
      lift("Incline DB press", 3, 8, 12, 120, "compound"),
    ],
    pull: [
      lift("Incline DB curl", 4, 8, 12, 90, "isolation"),
      lift("Hammer curl", 3, 8, 12, 90, "isolation", { restMinSeconds: 60 }),
      lift("Pull-ups", 3, 8, 12, 120, "compound", {
        mode: "bodyweight",
        note: "Add weight when all 3 sets reach 12; log added load (0 for bodyweight).",
      }),
      lift("Chest-supported row", 3, 8, 12, 120, "compound"),
      lift("Rear delt fly", 3, 12, 20, 60, "isolation"),
      lift("Hanging leg raise", 3, 8, 15, 60, "isolation", {
        mode: "bodyweight",
        progression: "reps",
      }),
    ],
    upper: [
      lift("Lateral raise", 3, 12, 20, 60, "isolation", {
        aliases: ["Lateral raises"],
      }),
      lift("Preacher curl", 3, 8, 12, 90, "isolation", { superset: "Arms" }),
      lift("Triceps pushdown", 3, 8, 12, 90, "isolation", { superset: "Arms" }),
      lift("Overhead press", 3, 8, 12, 120, "compound"),
      lift("Weighted pull-ups (heavy)", 2, 4, 6, 180, "compound", {
        mode: "bodyweight",
        note: "Separate 4–6-rep progression from Pull-day pull-ups. Log added load.",
      }),
      lift("Ab wheel", 3, 8, 15, 60, "isolation", {
        mode: "bodyweight",
        progression: "reps",
      }),
    ],
    legs: [
      {
        name: "Box or broad jumps",
        sets: 3,
        setsMax: 4,
        repRange: { min: 3, max: 5 },
        restSeconds: 90,
        category: "power",
        mode: "bodyweight",
        progression: "quality",
        note: "Fully fresh each set; stop when jump quality drops. Log Box jump or Broad jump separately.",
      },
      lift("Bulgarian split squat", 3, 8, 12, 120, "compound", {
        perSide: true,
      }),
      lift("Romanian deadlift", 3, 8, 12, 120, "compound"),
      lift("Hamstring curl", 2, 8, 12, 90, "isolation"),
      lift("Adductor", 2, 10, 15, 60, "isolation"),
      lift("Weighted cable crunch", 3, 10, 15, 60, "isolation"),
      {
        name: "Farmer carry (heavy)",
        sets: 2,
        distanceMetres: 40,
        restSeconds: 90,
        category: "carry",
        mode: "carry",
        progression: "distance",
        aliases: ["Farmer carries"],
        note: "About 40 m per carry; choose a heavy, controlled load.",
      },
    ],
  },
  rules: [
    "Isolation exercises: leave 1–2 reps in reserve on earlier sets; take the final set to failure with good form. Stop when another clean rep will not go up.",
    "Compounds: leave 1–2 reps in reserve on every set; never grind to failure. Jumps stay fresh and explosive.",
    "Progression: reach the top of the exercise’s rep range on all prescribed sets, then add the smallest available weight increment. Record the target before each set. Bodyweight abs progress through their rep range; jumps prioritize quality.",
    "Warm-up: 1–2 light ramp-up sets before the first compound. Do not count warm-ups as work sets.",
    "Missed day: continue the sequence rather than skipping ahead. Weekdays are the intended layout; lifting advances Push → Pull → Upper → Legs. Cardio does not advance it.",
    "Extra lifting day: repeat Push or Pull, whichever is next. Aim for about 50–60 minutes per lifting session.",
    "Superset: alternate Preacher curl and Triceps pushdown for 3 rounds; rest 90 seconds after both exercises in each pair.",
  ],
  rationale:
    "Build bigger, stronger arms, particularly biceps, strengthen abs and develop forearms while maintaining full-body strength and conditioning. Four main lift sessions: Push, Pull, Upper, Legs; HIIT Wednesday, soccer Saturday, optional easy Sunday jog. Weekday layout can move; keep the lifting sequence. This replaces the earlier short legs-block program.",
};
