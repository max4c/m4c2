import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { sessionCookie, validSession } from "@/lib/fitness/session";
import { restRequest } from "../../../../../shared/push";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
export async function GET(r: NextRequest) {
  if (!validSession(r.cookies.get(sessionCookie)?.value))
    return NextResponse.json({ error: "Sign in" }, { status: 401, headers });
  return NextResponse.json(
    { publicKey: process.env.VAPID_PUBLIC_KEY ?? null },
    { headers },
  );
}
export async function POST(r: NextRequest) {
  if (!validSession(r.cookies.get(sessionCookie)?.value))
    return NextResponse.json({ error: "Sign in" }, { status: 401, headers });
  if (r.headers.get("origin") !== process.env.DASHBOARD_ORIGIN)
    return NextResponse.json(
      { error: "Invalid origin" },
      { status: 403, headers },
    );
  try {
    if (Number(r.headers.get("content-length") ?? 0) > 6000) throw new Error();
    const body = await r.text();
    if (body.length > 6000) throw new Error();
    const input = restRequest.parse(JSON.parse(body));
    const result = await new ConvexHttpClient(process.env.CONVEX_URL!).mutation(
      api.rest.configure,
      { token: process.env.CONVEX_SERVICE_TOKEN!, input },
    );
    return NextResponse.json(result, { headers });
  } catch {
    return NextResponse.json(
      { error: "Unable to configure rest notification" },
      { status: 400, headers },
    );
  }
}
