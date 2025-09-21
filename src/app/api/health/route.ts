import { NextRequest } from "next/server";
import { ok, preflight, withCors } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const payload = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  };
  return withCors(ok(payload), request);
}

export function OPTIONS(request: NextRequest) {
  return preflight(request);
}