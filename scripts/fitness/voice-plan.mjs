// Preserve the live program; enrich its existing movements, never reset it to a seed.
export function voicePlan(plan) {
  const stations = {
    "Cable overhead triceps extension": "cable stack",
    "Lateral raise": "dumbbells",
    "Weighted dips": "dip bars",
    "Incline DB press": "dumbbell bench",
    "Incline DB curl": "dumbbell bench",
    "Hammer curl": "dumbbells",
    "Pull-ups": "pull-up bar",
    "Chest-supported row": "row station",
    "Rear delt fly": "rear delt station",
    "Hanging leg raise": "pull-up bar",
    "Preacher curl": "preacher bench",
    "Overhead DB triceps extension": "preacher bench",
    "Overhead press": "dumbbell bench",
    "Weighted pull-ups (heavy)": "pull-up bar",
    "Ab wheel": "floor",
    "Box or broad jumps": "open floor",
    "Bulgarian split squat": "dumbbell bench",
    "Romanian deadlift": "barbell platform",
    "Hamstring curl": "leg curl machine",
    Adductor: "adductor machine",
    "Weighted cable crunch": "cable stack",
    "Farmer carry (heavy)": "dumbbells",
  };
  const backups = {
    "Cable overhead triceps extension": [
      "Overhead DB triceps extension",
      "dumbbells",
      "weighted",
      "total",
    ],
    "Lateral raise": [
      "Cable lateral raise",
      "cable stack",
      "weighted",
      "total",
    ],
    "Weighted dips": ["DB floor press", "dumbbells", "weighted", "perDumbbell"],
    "Incline DB press": [
      "Incline machine press",
      "press machine",
      "weighted",
      "total",
    ],
    "Incline DB curl": [
      "Standing DB curl",
      "dumbbells",
      "weighted",
      "perDumbbell",
    ],
    "Hammer curl": ["Rope hammer curl", "cable stack", "weighted", "total"],
    "Pull-ups": ["Lat pulldown", "cable stack", "weighted", "total"],
    "Chest-supported row": [
      "Seated cable row",
      "cable stack",
      "weighted",
      "total",
    ],
    "Rear delt fly": [
      "DB rear delt fly",
      "dumbbells",
      "weighted",
      "perDumbbell",
    ],
    "Hanging leg raise": [
      "Reverse crunch",
      "floor",
      "bodyweight",
      "addedToBodyweight",
    ],
    "Preacher curl": [
      "Incline DB curl",
      "dumbbell bench",
      "weighted",
      "perDumbbell",
    ],
    "Overhead DB triceps extension": [
      "Cable overhead triceps extension",
      "cable stack",
      "weighted",
      "total",
    ],
    "Overhead press": [
      "Machine shoulder press",
      "press machine",
      "weighted",
      "total",
    ],
    "Weighted pull-ups (heavy)": [
      "Lat pulldown (heavy)",
      "cable stack",
      "weighted",
      "total",
    ],
    "Ab wheel": ["Reverse crunch", "floor", "bodyweight", "addedToBodyweight"],
    "Box or broad jumps": [
      "Squat jump",
      "open floor",
      "bodyweight",
      "addedToBodyweight",
    ],
    "Bulgarian split squat": [
      "DB reverse lunge",
      "dumbbells",
      "weighted",
      "perDumbbell",
    ],
    "Romanian deadlift": [
      "DB Romanian deadlift",
      "dumbbells",
      "weighted",
      "perDumbbell",
    ],
    "Hamstring curl": [
      "Slider hamstring curl",
      "floor",
      "bodyweight",
      "addedToBodyweight",
    ],
    Adductor: ["Cable hip adduction", "cable stack", "weighted", "total"],
    "Weighted cable crunch": [
      "Weighted floor crunch",
      "floor",
      "weighted",
      "total",
    ],
    "Farmer carry (heavy)": [
      "Kettlebell farmer carry",
      "kettlebells",
      "carry",
      "perDumbbell",
    ],
  };
  return Object.fromEntries(
    Object.entries(plan.program).map(([day, exercises]) => [
      day,
      exercises.map((e) => {
        const perDB = [
          "Lateral raise",
          "Incline DB press",
          "Incline DB curl",
          "Hammer curl",
          "Overhead press",
          "Bulgarian split squat",
          "Farmer carry (heavy)",
        ].includes(e.name);
        const n = {
          ...e,
          loadConvention:
            e.loadConvention ??
            (e.name === "Preacher curl"
              ? "platesOnly"
              : e.mode === "bodyweight"
                ? "addedToBodyweight"
                : perDB
                  ? "perDumbbell"
                  : "total"),
          station: e.station ?? stations[e.name],
        };
        const b = backups[e.name];
        if (b && !e.backup)
          n.backup = {
            name: b[0],
            station: b[1],
            mode: b[2],
            loadConvention: b[3],
            note: "Use this movement's own history; choose a starting load if none exists.",
          };
        if (e.name === "Preacher curl") {
          n.weightIncrement = 5;
          n.note =
            "EZ bar on the preacher bench. Weight counts plates only; exclude the bar.";
        }
        if (e.name === "Overhead DB triceps extension") {
          n.weightIncrement = 5;
          n.easyWeightIncrementMax = 10;
          n.note =
            "Standing, one dumbbell held with both hands, next to the preacher bench.";
        }
        if (e.name === "Weighted pull-ups (heavy)") n.weightIncrement = 5;
        return n;
      }),
    ]),
  );
}
