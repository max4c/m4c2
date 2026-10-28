import { handleFitnessRequest } from "@/lib/fitness/mcp";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export function POST(request: Request) {
  return handleFitnessRequest(request, process.env);
}
export const GET = POST;
export const DELETE = POST;
export const OPTIONS = POST;
