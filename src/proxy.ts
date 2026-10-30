import { NextResponse, type NextRequest } from "next/server";
const privatePath = (path: string) =>
  path === "/fitness" ||
  path.startsWith("/fitness/") ||
  path.startsWith("/mcp/") ||
  path.startsWith("/photos/");
const assets = new Set([
  "/supermedium-icons/bonsai-180.png",
  "/supermedium-icons/bonsai-192.png",
  "/supermedium-icons/bonsai-512.png",
  "/supermedium-icons/icon.svg",
  "/supermedium-icons/icon-32.png",
  "/supermedium-icons/icon-192.png",
  "/supermedium-icons/icon-512.png",
  "/supermedium-icons/apple-touch-icon.png",
  "/fitness.webmanifest",
  "/favicon.ico",
  "/icon-192.png",
  "/apple-touch-icon.png",
]);
const privateHeaders = {
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};
export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();
  const appHost = process.env.FITNESS_APP_HOST?.toLowerCase();
  const path = request.nextUrl.pathname;
  const isApp = Boolean(appHost && host === appHost);
  // A read token is remembered on the app origin. Never serve public-site
  // analytics or pages on that origin, or the tracker on the blog origin.
  if (privatePath(path) && !appHost)
    return new NextResponse("Fitness hostname is not configured", {
      status: 503,
      headers: privateHeaders,
    });
  if (privatePath(path) && !isApp) {
    const destination = request.nextUrl.clone();
    destination.hostname = appHost!;
    if (!appHost!.endsWith(".localhost")) {
      destination.protocol = "https:";
      destination.port = "";
    }
    const response = NextResponse.redirect(destination, 307);
    for (const [key, value] of Object.entries(privateHeaders))
      response.headers.set(key, value);
    return response;
  }
  if (!isApp) return NextResponse.next();
  const appIcons: Record<string, string> = {
    "/apple-touch-icon.png": "/supermedium-icons/bonsai-180.png",
  };
  if (appIcons[path])
    return NextResponse.rewrite(new URL(appIcons[path], request.url));
  if (path === "/robots.txt")
    return new NextResponse("User-agent: *\nDisallow: /\n", {
      headers: { ...privateHeaders, "Content-Type": "text/plain" },
    });
  if (path.startsWith("/_next/") || assets.has(path))
    return NextResponse.next();
  if (path !== "/" && !privatePath(path))
    return new NextResponse("Not found", {
      status: 404,
      headers: privateHeaders,
    });
  const response =
    path === "/"
      ? NextResponse.rewrite(new URL("/fitness", request.url))
      : NextResponse.next();
  for (const [key, value] of Object.entries(privateHeaders))
    response.headers.set(key, value);
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
