import { NextRequest } from "next/server";
import { api } from "../../../../../convex/_generated/api";
import {
  backend,
  callback,
  clientId,
  credential,
  digest,
  oauthJson,
  origin,
  resource,
  validConsent,
} from "@/lib/wardrobe/connection";
import { sessionCookie, sessionOwner } from "@/lib/wardrobe/session";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (!validConsent(params))
    return oauthJson({ error: "invalid_request" }, 400);
  // Resolve only the registered ChatGPT document, never an inbound client URL.
  try {
    const response = await fetch(clientId, {
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    const metadata = response.ok && (await response.json());
    if (
      metadata.client_id !== clientId ||
      !metadata.redirect_uris?.includes(callback) ||
      !metadata.token_endpoint_auth_methods_supported?.includes("none")
    )
      return oauthJson({ error: "invalid_client" }, 400);
  } catch {
    return oauthJson({ error: "temporarily_unavailable" }, 503);
  }
  return Response.redirect(origin() + "/#connect?" + params.toString(), 303);
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== origin())
    return oauthJson({ error: "invalid_origin" }, 403);
  const owner = sessionOwner(request.cookies.get(sessionCookie)?.value);
  if (!owner)
    return oauthJson({ error: "Sign in to your wardrobe and reconnect." }, 401);
  const params = new URLSearchParams(await request.text());
  if (!validConsent(params))
    return oauthJson({ error: "invalid_request" }, 400);
  if (params.get("displayed_owner") !== owner)
    return oauthJson(
      { error: "Your wardrobe account changed. Reconnect and try again." },
      409,
    );
  const target = new URL(callback);
  target.searchParams.set("iss", origin());
  if (params.has("state"))
    target.searchParams.set("state", params.get("state")!);
  if (params.get("decision") === "allow") {
    const code = credential();
    const { db, token } = backend();
    await db.mutation(api.wardrobe.issueConnectionCode, {
      token,
      owner,
      code: digest(code),
      challenge: params.get("code_challenge")!,
      resource: resource(),
      offline: (params.get("scope") ?? "")
        .split(" ")
        .includes("offline_access"),
    });
    target.searchParams.set("code", code);
  } else {
    target.searchParams.set("error", "access_denied");
  }
  if (request.headers.get("accept") === "application/json")
    return oauthJson({ redirect: target.href });
  return Response.redirect(target, 303);
}
