import { NextRequest, NextResponse } from "next/server";

// Unified JSON response helpers
export const ok = <T>(data: T, init: ResponseInit = {}) =>
  NextResponse.json({ success: true, data }, { status: 200, ...init });

export const created = <T>(data: T, init: ResponseInit = {}) =>
  NextResponse.json({ success: true, data }, { status: 201, ...init });

export const badRequest = (message = "Bad Request", details?: unknown) =>
  NextResponse.json({ success: false, error: { message, details } }, { status: 400 });

export const unauthorized = (message = "Unauthorized") =>
  NextResponse.json({ success: false, error: { message } }, { status: 401 });

export const notFound = (message = "Not Found") =>
  NextResponse.json({ success: false, error: { message } }, { status: 404 });

export const serverError = (message = "Internal Server Error", details?: unknown) =>
  NextResponse.json({ success: false, error: { message, details } }, { status: 500 });

// Minimal CORS handler for API routes
export function withCors(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get("origin") || "*";
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Vary", "Origin");
  response.headers.set(
    "Access-Control-Allow-Headers",
    request.headers.get("Access-Control-Request-Headers") || "Content-Type, Authorization"
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    request.headers.get("Access-Control-Request-Method") || "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

export function preflight(request: NextRequest) {
  return withCors(new NextResponse(null, { status: 204 }), request);
}