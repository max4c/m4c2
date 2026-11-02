import { NextRequest } from "next/server";
import { ConvexClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { sessionCookie, validSession } from "@/lib/fitness/session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  if (!validSession(request.cookies.get(sessionCookie)?.value))
    return new Response("Sign in", { status: 401 });
  const db = new ConvexClient(process.env.CONVEX_URL!);
  let finish = () => {};
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const encoder = new TextEncoder();
      let unsubscribe = () => {};
      let timeout: ReturnType<typeof setTimeout>;
      finish = () => {
        if (closed) return;
        closed = true;
        clearTimeout(timeout);
        unsubscribe();
        void db.close();
        request.signal.removeEventListener("abort", finish);
        try {
          controller.close();
        } catch {}
      };
      const send = (text: string) => {
        if (!closed)
          try {
            controller.enqueue(encoder.encode(text));
          } catch {
            finish();
          }
      };
      send("retry: 1000\n\n");
      unsubscribe = db.onUpdate(
        api.voice.watch_session,
        { token: process.env.DASHBOARD_TOKEN! },
        (value) => send(`data: ${JSON.stringify(value)}\n\n`),
        () => {
          send("event: unavailable\ndata: {}\n\n");
          finish();
        },
      );
      timeout = setTimeout(finish, 50_000);
      request.signal.addEventListener("abort", finish, { once: true });
      if (request.signal.aborted) finish();
    },
    cancel() {
      finish();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
