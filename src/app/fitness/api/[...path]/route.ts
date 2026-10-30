import { todayAt } from "../../../../../shared/model";
import { getGarminSleep } from "@/lib/fitness/garmin";
import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { AwsClient } from "aws4fetch";
import { api } from "../../../../../convex/_generated/api";
import {
  createSession,
  passwordMatches,
  validSession,
  sessionCookie,
  sessionSeconds,
} from "@/lib/fitness/session";
export const runtime = "nodejs";
const headers = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });
function db() {
  return new ConvexHttpClient(process.env.CONVEX_URL!);
}
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== process.env.DASHBOARD_ORIGIN)
    return json({ error: "Invalid origin" }, 403);
  const action = request.nextUrl.pathname;
  if (action === "/fitness/api/logout") {
    const response = json({ ok: true });
    response.cookies.set(sessionCookie, "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  }
  if (action !== "/fitness/api/login") return json({ error: "Not found" }, 404);
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 2048)
      return json({ error: "Invalid request" }, 400);
    const text = await request.text();
    if (text.length > 2048) return json({ error: "Invalid request" }, 400);
    const { password } = JSON.parse(text);
    if (typeof password !== "string" || password.length > 256)
      return json({ error: "Invalid request" }, 400);
    const limit = await db().mutation(api.fitness.dashboard_login_attempt, {
      token: process.env.CONVEX_SERVICE_TOKEN!,
      client: createHmac("sha256", process.env.SUPERMEDIUM_SESSION_SECRET!)
        .update(
          process.env.VERCEL
            ? (request.headers.get("x-forwarded-for") ?? "unknown")
            : "local",
        )
        .digest("hex"),
    });
    if (!limit.allowed)
      return json(
        { error: "Too many attempts. Try again in 15 minutes." },
        429,
      );
    if (!passwordMatches(password))
      return json({ error: "Incorrect password." }, 401);
    const response = json({ ok: true });
    response.cookies.set(sessionCookie, createSession(), {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: sessionSeconds,
    });
    return response;
  } catch {
    return json({ error: "Unable to sign in. Please try again." }, 503);
  }
}
export async function GET(request: NextRequest) {
  if (!validSession(request.cookies.get(sessionCookie)?.value))
    return json({ error: "Sign in required" }, 401);
  const path = request.nextUrl.pathname;
  try {
    if (path === "/fitness/api/data") {
      const data = await db().query(api.fitness.dashboard, {
        token: process.env.DASHBOARD_TOKEN!,
      });
      return json(data);
    }
    if (path === "/fitness/api/sleep") {
      const plan = await db().query(api.fitness.get_plan, {
        token: process.env.CONVEX_SERVICE_TOKEN!,
      });
      return json(await getGarminSleep(todayAt(Date.now(), plan.timezone)));
    }
    const key = path.replace(/^\/fitness\/api\/photo\//, "");
    if (
      !path.startsWith("/fitness/api/photo/") ||
      !/^progress\/[\w/-]+\.(jpg|png|webp)$/.test(key)
    )
      return json({ error: "Not found" }, 404);
    const e = process.env;
    if (
      !e.R2_ACCOUNT_ID ||
      !e.R2_ACCESS_KEY_ID ||
      !e.R2_SECRET_ACCESS_KEY ||
      !e.R2_BUCKET
    )
      return json({ error: "Photo storage unavailable" }, 503);
    const aws = new AwsClient({
      accessKeyId: e.R2_ACCESS_KEY_ID,
      secretAccessKey: e.R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    });
    const signed = await aws.sign(
      `https://${e.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${e.R2_BUCKET}/${key}`,
    );
    const object = await fetch(signed, {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!object.ok)
      return json(
        { error: "Photo unavailable" },
        object.status === 404 ? 404 : 502,
      );
    return new Response(object.body, {
      headers: {
        ...headers,
        "X-Content-Type-Options": "nosniff",
        "Content-Type": key.endsWith(".jpg")
          ? "image/jpeg"
          : key.endsWith(".png")
            ? "image/png"
            : "image/webp",
      },
    });
  } catch {
    return json({ error: "Unable to load your log" }, 503);
  }
}
