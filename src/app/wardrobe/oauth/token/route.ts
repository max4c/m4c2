import { api } from "../../../../../convex/_generated/api";
import {
  backend,
  callback,
  clientId,
  credential,
  digest,
  oauthJson,
  resource,
  scope,
} from "@/lib/wardrobe/connection";

export async function POST(request: Request) {
  const p = new URLSearchParams(await request.text());
  if (p.get("client_id") !== clientId)
    return oauthJson({ error: "invalid_client" }, 400);
  if (p.has("resource") && p.get("resource") !== resource())
    return oauthJson({ error: "invalid_target" }, 400);
  const grant = p.get("grant_type");
  if (grant !== "authorization_code" && grant !== "refresh_token")
    return oauthJson({ error: "unsupported_grant_type" }, 400);
  const verifier = p.get("code_verifier") ?? "";
  if (
    grant === "authorization_code" &&
    (p.get("redirect_uri") !== callback ||
      !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier))
  )
    return oauthJson({ error: "invalid_grant" }, 400);
  const presented = p.get(
    grant === "authorization_code" ? "code" : "refresh_token",
  );
  if (!presented || !/^[A-Za-z0-9_-]{43}$/.test(presented))
    return oauthJson({ error: "invalid_grant" }, 400);
  const { db, token } = backend();
  const access = credential(),
    refresh = credential();
  const result = await db.mutation(api.wardrobe.exchangeConnection, {
    token,
    resource: resource(),
    presented: digest(presented),
    access: digest(access),
    refresh: digest(refresh),
    ...(grant === "authorization_code" ? { challenge: digest(verifier) } : {}),
  });
  if (!result) return oauthJson({ error: "invalid_grant" }, 400);
  return oauthJson({
    access_token: access,
    token_type: "Bearer",
    expires_in: 3600,
    scope: result.offline ? scope + " offline_access" : scope,
    ...(result.offline ? { refresh_token: refresh } : {}),
  });
}
