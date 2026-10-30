export type RestTimerState = { label: string; endsAt: number };
export const remainingSeconds = (endsAt: number, now: number) =>
  Math.max(0, Math.ceil((endsAt - now) / 1000));
export function restoreTimer(
  raw: string | null,
  now: number,
): RestTimerState | null {
  try {
    const value = JSON.parse(raw ?? "null");
    return value &&
      typeof value.label === "string" &&
      value.label.length <= 200 &&
      Number.isFinite(value.endsAt) &&
      value.endsAt >= now - 10 * 60_000 &&
      value.endsAt <= now + 30 * 60_000
      ? value
      : null;
  } catch {
    return null;
  }
}
