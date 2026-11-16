import { NextRequest, NextResponse } from "next/server";
import { catalogTile } from "@/lib/wardrobe/catalog-photo";
import { ConvexHttpClient } from "convex/browser";
import { ConvexError } from "convex/values";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import {
  metadataSchema,
  owners,
  ownerName,
  views,
  type WardrobeOwner,
  type WardrobeView,
} from "../../../../../shared/wardrobe";
import {
  createSession,
  loginClient,
  passwordMatches,
  sessionCookie,
  sessionOwner,
  sessionSeconds,
} from "@/lib/wardrobe/session";

export const runtime = "nodejs";
const headers = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
const json = (value: unknown, status = 200) =>
  NextResponse.json(value, { status, headers });
const configured = () =>
  Boolean(
    process.env.CONVEX_URL &&
    process.env.WARDROBE_SERVICE_TOKEN &&
    process.env.WARDROBE_SESSION_SECRET &&
    process.env.WARDROBE_MAX_PASSWORD_HASH &&
    process.env.WARDROBE_ZHANEL_PASSWORD_HASH,
  );
const db = () => new ConvexHttpClient(process.env.CONVEX_URL!);
function auth(request: NextRequest) {
  const owner = sessionOwner(request.cookies.get(sessionCookie)?.value);
  return owner ? { token: process.env.WARDROBE_SERVICE_TOKEN!, owner } : null;
}
function setCookie(response: NextResponse, value: string, maxAge: number) {
  response.cookies.set(sessionCookie, value, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge,
  });
  return response;
}
export async function GET(request: NextRequest) {
  if (!configured())
    return json(
      { error: "Your wardrobe is being set up. Please try again shortly." },
      503,
    );
  const credentials = auth(request);
  if (!credentials) return json({ error: "Sign in required" }, 401);
  try {
    const path = request.nextUrl.pathname;
    if (path === "/wardrobe/api/items")
      return json({
        owner: credentials.owner,
        name: ownerName[credentials.owner],
        items: await db().query(api.wardrobe.list, {
          ...credentials,
          includeRetired: request.nextUrl.searchParams.get("includeRetired") === "1",
        }),
      });
    if (path === "/wardrobe/api/outfits")
      return json(await db().query(api.wardrobe.latestWeek, credentials));
    const portrait = path.match(/^\/wardrobe\/api\/outfit-image\/([a-zA-Z0-9]+)\/([0-4])$/);
    const match = path.match(
      /^\/wardrobe\/api\/image\/([a-zA-Z0-9]+)\/(front|side|back|detail|source)$/,
    );
    if (!portrait && (!match || !views.includes(match[2] as WardrobeView)))
      return json({ error: "Not found" }, 404);
    const url = portrait ? await db().query(api.wardrobe.weeklyImage, {
      ...credentials, id: portrait[1] as Id<"wardrobeWeeks">, day: Number(portrait[2]),
    }) : await db().query(api.wardrobe.image, {
      ...credentials,
      id: match![1] as Id<"wardrobeItems">,
      view: match![2] as WardrobeView,
    });
    if (!url) return json({ error: "Image not found" }, 404);
    const image = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const contentType = image.headers.get("content-type")?.split(";")[0] ?? "";
    if (
      !image.ok ||
      !["image/jpeg", "image/png", "image/webp"].includes(contentType)
    )
      return json({ error: "Image unavailable" }, 502);
    if (match && request.nextUrl.searchParams.get("size") === "tile") {
      const bytes = Buffer.from(await image.arrayBuffer());
      const tile = await catalogTile(bytes);
      return new Response(new Uint8Array(tile), {
        headers: { ...headers, "Content-Type": "image/webp" },
      });
    }
    return new Response(image.body, {
      headers: { ...headers, "Content-Type": contentType },
    });
  } catch {
    return json(
      { error: "Unable to load your wardrobe. Please try again." },
      503,
    );
  }
}
export async function POST(request: NextRequest) {
  const origin = process.env.WARDROBE_ORIGIN;
  if (!origin || request.headers.get("origin") !== origin)
    return json({ error: "Invalid origin" }, 403);
  const path = request.nextUrl.pathname;
  if (path === "/wardrobe/api/logout")
    return setCookie(json({ ok: true }), "", 0);
  if (!configured())
    return json(
      { error: "Your wardrobe is being set up. Please try again shortly." },
      503,
    );
  const deleting = path === "/wardrobe/api/delete";
  if (
    !deleting &&
    !["/wardrobe/api/login", "/wardrobe/api/update"].includes(path)
  )
    return json({ error: "Not found" }, 404);
  const credentials = auth(request);
  if (path !== "/wardrobe/api/login" && !credentials)
    return json({ error: "Sign in required" }, 401);
  let body;
  try {
    const text = await request.text();
    if (text.length > 4096) return json({ error: "Request too large" }, 413);
    body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  if (path === "/wardrobe/api/login") {
    const owner =
      typeof body.username === "string"
        ? (body.username.trim().toLowerCase() as WardrobeOwner)
        : null;
    try {
      const client = loginClient(
        process.env.VERCEL
          ? (request.headers.get("x-forwarded-for") ?? "unknown")
          : "local",
      );
      const allowed = await db().mutation(api.wardrobe.loginAttempt, {
        token: process.env.WARDROBE_SERVICE_TOKEN!,
        client,
      });
      if (!allowed)
        return json(
          { error: "Too many attempts. Try again in 15 minutes." },
          429,
        );
      if (
        !owner ||
        !owners.includes(owner) ||
        typeof body.password !== "string" ||
        !passwordMatches(owner, body.password)
      )
        return json({ error: "Incorrect username or password." }, 401);
      return setCookie(
        json({ ok: true }),
        createSession(owner),
        sessionSeconds,
      );
    } catch {
      return json({ error: "Unable to sign in. Please try again." }, 503);
    }
  }
  if (
    typeof body.id !== "string" ||
    !/^[a-zA-Z0-9]+$/.test(body.id) ||
    typeof body.expectedUpdatedAt !== "number"
  )
    return json({ error: "Check the item details and try again." }, 400);
  try {
    const target = {
      ...credentials!,
      id: body.id as Id<"wardrobeItems">,
      expectedUpdatedAt: body.expectedUpdatedAt,
    };
    if (deleting) {
      await db().mutation(api.wardrobe.remove, target);
    } else {
      const parsed = metadataSchema.safeParse(body.fields);
      const retirement = body.retirement;
      if (retirement != null && (typeof retirement.note !== "string" || retirement.note.length > 600))
        return json({ error: "Check the retirement note." }, 400);
      if (!parsed.success)
        return json({ error: "Check the item details and try again." }, 400);
      await db().mutation(api.wardrobe.update, {
        ...target,
        fields: parsed.data,
        ...(retirement !== undefined && { retirement: retirement && { note: retirement.note.trim() } }),
      });
    }
    return json({ ok: true });
  } catch (error) {
    const reason = error instanceof ConvexError ? error.data : null;
    if (reason === "This item changed. Reload before deleting.")
      return json({ error: reason }, 409);
    if (reason === "This item changed. Reload before saving.")
      return json(
        {
          error:
            "This item changed in another session. Close it and refresh before saving.",
        },
        409,
      );
    if (reason === "Item not found")
      return json({ error: "Item not found" }, 404);
    return json(
      {
        error: deleting
          ? "Unable to delete this item. Please try again."
          : "Unable to save. Your changes are still here; please try again.",
      },
      503,
    );
  }
}
