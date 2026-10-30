import { z } from "zod";
const nightSchema = z.object({
  calendarDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sleepTimeSeconds: z.number().positive().max(86400),
  sleepStartTimestampGMT: z
    .number()
    .positive()
    .nullable()
    .optional()
    .catch(null),
  sleepEndTimestampGMT: z.number().positive().nullable().optional().catch(null),
  sleepScores: z
    .object({
      overall: z
        .object({ value: z.number().min(0).max(100).nullable().optional() })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional()
    .catch(null),
});
export type SleepNight = {
  date: string;
  hours: number;
  seconds: number;
  start: number | null;
  end: number | null;
  score: number | null;
};
export type SleepData = {
  status: "connected" | "unavailable" | "not_configured";
  nights: SleepNight[];
  fetchedAt: string | null;
};
export function normalizeSleep(
  raw: unknown,
  start: string,
  end: string,
): SleepNight[] {
  if (!Array.isArray(raw)) throw new Error("Invalid Garmin response");
  const nights = new Map<string, SleepNight>();
  for (const row of raw) {
    const parsed = nightSchema.safeParse(row);
    if (!parsed.success) continue;
    const n = parsed.data;
    if (n.calendarDate < start || n.calendarDate > end) continue;
    nights.set(n.calendarDate, {
      date: n.calendarDate,
      seconds: n.sleepTimeSeconds,
      hours: Math.round((n.sleepTimeSeconds / 3600) * 100) / 100,
      start: n.sleepStartTimestampGMT ?? null,
      end: n.sleepEndTimestampGMT ?? null,
      score: n.sleepScores?.overall?.value ?? null,
    });
  }
  return [...nights.values()].sort((a, b) => a.date.localeCompare(b.date));
}
export function sleepDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
