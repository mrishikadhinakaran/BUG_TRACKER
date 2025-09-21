import { NextRequest } from "next/server";
import { ok, preflight, withCors } from "@/lib/api/response";
import { checkRateLimit, tooManyRequests } from "@/lib/api/rate-limit";

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, { limit: 120, windowMs: 60_000, keyPrefix: "rl:api-index" });
  if (!rl.allowed) {
    return withCors(tooManyRequests("Rate limit exceeded", rl.headers), request);
  }

  const base = "/api" as const;
  const routes = [
    { method: "GET", path: `${base}`, description: "API index" },
    { method: "GET", path: `${base}/health`, description: "Health check" },
    { method: "GET", path: `${base}/openapi`, description: "OpenAPI 3.1 document" },
    { method: "GET|POST", path: `${base}/users`, description: "List/Create users" },
    { method: "GET|PATCH|DELETE", path: `${base}/users/[id]`, description: "Read/Update/Delete a user" },
    { method: "GET|POST", path: `${base}/projects`, description: "List/Create projects" },
    { method: "GET|PATCH|DELETE", path: `${base}/projects/[id]`, description: "Read/Update/Delete a project" },
    { method: "GET|POST|PATCH|DELETE", path: `${base}/projects/[id]/members`, description: "Manage project members" },
    { method: "GET|POST", path: `${base}/bugs`, description: "List/Create bugs" },
    { method: "GET|PATCH|DELETE", path: `${base}/bugs/[id]`, description: "Read/Update/Delete a bug" },
    { method: "GET|POST", path: `${base}/bugs/[id]/comments`, description: "List/Create comments for a bug" },
    { method: "GET|DELETE", path: `${base}/comments/[id]`, description: "Read/Delete a comment" },
    { method: "GET", path: `${base}/bugs/[id]/history`, description: "Bug change history" },
  ];

  const response = withCors(ok({ name: "Bug Tracker API", version: "v1", routes }), request);
  response.headers.set("X-RateLimit-Limit", rl.headers.get("X-RateLimit-Limit") || "");
  response.headers.set("X-RateLimit-Remaining", rl.headers.get("X-RateLimit-Remaining") || "");
  return response;
}

export function OPTIONS(request: NextRequest) {
  return preflight(request);
}