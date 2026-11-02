import { z } from "zod";
export const logSetInput = z.object({
  exercise: z.string().trim().min(1).max(120),
  weight: z.number().finite().min(0).max(2000),
  reps: z.number().int().min(1).max(1000),
  rir: z.number().min(0).max(10).optional(),
  effort: z.enum(["easy", "atLimit"]).optional(),
  note: z.string().max(1000).optional(),
  requestId: z
    .string()
    .min(8)
    .max(120)
    .describe(
      "Generate a unique ID for this set; reuse it only when retrying this exact set. Do not ask the user to supply it.",
    ),
});
export const swapInput = z.object({
  exercise: z.string().min(1).max(120),
  useBackup: z
    .boolean()
    .default(false)
    .describe("Use the configured backup instead of picking remaining work."),
});
export const nextNoteInput = z.object({
  exercise: z.string().min(1).max(120),
  note: z.string().min(1).max(1000),
});
export const renameInput = z.object({
  from: z.string().min(1).max(120),
  to: z.string().trim().min(1).max(120),
  merge: z
    .boolean()
    .default(false)
    .describe(
      "True only when the user confirms these names describe the same movement; never merge distinct variants.",
    ),
});
