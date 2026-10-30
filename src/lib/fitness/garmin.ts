import "server-only";
import { createHash } from "node:crypto";
import { addDays } from "../../../shared/model";
import { normalizeSleep, type SleepData } from "../../../shared/sleep";
const base = "https://personal.connectapi.garmin.com";
let tokenCache: { key: string; token: string; expires: number } | undefined;
let sleepCache: { key: string; expires: number; result: SleepData } | undefined;
async function accessToken(key: string, fingerprint: string) {
  if (tokenCache?.key === fingerprint && tokenCache.expires > Date.now())
    return tokenCache.token;
  const response = await fetch(
    `${base}/personalapitoken-service/personal-api/personal-api-key/token`,
    {
      method: "POST",
      headers: { Authorization: `ApiKey ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) throw new Error("Garmin authentication failed");
  const token = (await response.text()).trim();
  if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token))
    throw new Error("Invalid Garmin token");
  // Keep short-lived tokens in server memory only. Renew before their 24-hour expiry.
  tokenCache = { key: fingerprint, token, expires: Date.now() + 23 * 3600000 };
  return token;
}
export async function getGarminSleep(today: string): Promise<SleepData> {
  const key = process.env.GARMIN_PERSONAL_API_KEY?.trim();
  if (!key) return { status: "not_configured", nights: [], fetchedAt: null };
  const fingerprint = createHash("sha256").update(key).digest("hex");
  const cacheKey = `${fingerprint}:${today}`;
  if (sleepCache?.key === cacheKey && sleepCache.expires > Date.now())
    return sleepCache.result;
  try {
    const start = addDays(today, -29);
    const token = await accessToken(key, fingerprint);
    const response = await fetch(
      `${base}/sleep-service/sleep/dailySleepSummariesByDate?startDate=${start}&endDate=${today}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    if (response.status === 401) tokenCache = undefined;
    if (!response.ok) throw new Error("Garmin sleep unavailable");
    const raw = await response.json();
    const result: SleepData = {
      status: "connected",
      nights: normalizeSleep(raw, start, today),
      fetchedAt: new Date().toISOString(),
    };
    sleepCache = { key: cacheKey, expires: Date.now() + 15 * 60000, result };
    return result;
  } catch {
    // Never log provider bodies or credentials; don't turn an outage into zero sleep.
    return { status: "unavailable", nights: [], fetchedAt: null };
  }
}
