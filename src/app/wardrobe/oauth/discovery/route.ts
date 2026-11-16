import { oauthJson, origin, resource, scope } from "@/lib/wardrobe/connection";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type");
  if (type === "resource")
    return oauthJson({
      resource: resource(),
      authorization_servers: [origin()],
      scopes_supported: [scope],
      bearer_methods_supported: ["header"],
    });
  if (type !== "issuer") return oauthJson({ error: "not_found" }, 404);
  return oauthJson({
    issuer: origin(),
    authorization_endpoint: origin() + "/wardrobe/oauth/authorize",
    token_endpoint: origin() + "/wardrobe/oauth/token",
    scopes_supported: [scope, "offline_access"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    authorization_response_iss_parameter_supported: true,
    client_id_metadata_document_supported: true,
  });
}
