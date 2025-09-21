import { NextRequest } from "next/server";
import { ok, preflight, withCors } from "@/lib/api/response";
import { checkRateLimit, tooManyRequests } from "@/lib/api/rate-limit";

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, { limit: 60, windowMs: 60_000, keyPrefix: "rl:health" });
  if (!rl.allowed) {
    const resp = withCors(tooManyRequests("Rate limit exceeded", rl.headers), request);
    return resp;
  }

  const payload = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  };
  const response = withCors(ok(payload), request);
  response.headers.set("X-RateLimit-Limit", rl.headers.get("X-RateLimit-Limit") || "");
  response.headers.set("X-RateLimit-Remaining", rl.headers.get("X-RateLimit-Remaining") || "");
  return response;
}

export function OPTIONS(request: NextRequest) {
  return preflight(request);
}