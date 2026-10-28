import { handleFitnessRequest } from "@/lib/fitness/mcp";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  return handleFitnessRequest(request, process.env);
}
export const HEAD = GET;
