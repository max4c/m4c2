import { describe, expect, it } from "vitest";
import { normalizeSleep, sleepDuration } from "../../shared/sleep";
describe("Garmin sleep summaries", () => {
  it("excludes null placeholders, zero nights and out-of-range data without inventing sleep", () => {
    expect(
      normalizeSleep(
        [
          { calendarDate: null, sleepTimeSeconds: null },
          { calendarDate: "2026-10-01", sleepTimeSeconds: 0 },
          { calendarDate: "2026-09-30", sleepTimeSeconds: 20000 },
          {
            calendarDate: "2026-10-03",
            sleepTimeSeconds: 27000,
            sleepScores: { overall: { value: 82 } },
            userNote: "private extra field",
          },
        ],
        "2026-10-01",
        "2026-10-30",
      ),
    ).toEqual([
      {
        date: "2026-10-03",
        seconds: 27000,
        hours: 7.5,
        start: null,
        end: null,
        score: 82,
      },
    ]);
  });
  it("keeps valid durations when optional metadata is invalid", () => {
    const [night] = normalizeSleep(
      [
        {
          calendarDate: "2026-10-02",
          sleepTimeSeconds: 25000,
          sleepStartTimestampGMT: 0,
          sleepScores: { overall: { value: -1 } },
        },
      ],
      "2026-10-01",
      "2026-10-30",
    );
    expect(night.seconds).toBe(25000);
    expect(night.score).toBeNull();
    expect(night.start).toBeNull();
  });
  it("orders and deduplicates wake dates", () => {
    const rows = normalizeSleep(
      [
        { calendarDate: "2026-10-02", sleepTimeSeconds: 20000 },
        { calendarDate: "2026-10-01", sleepTimeSeconds: 21000 },
        { calendarDate: "2026-10-02", sleepTimeSeconds: 22000 },
      ],
      "2026-10-01",
      "2026-10-30",
    );
    expect(rows.map((n) => n.seconds)).toEqual([21000, 22000]);
  });
  it("rejects unexpected response envelopes and formats minute rollover", () => {
    expect(() =>
      normalizeSleep({ error: "bad" }, "2026-10-01", "2026-10-30"),
    ).toThrow();
    expect(sleepDuration(28799)).toBe("8h 0m");
  });
});
