import { NextRequest, NextResponse } from "next/server";

function normalizeOrigin(origin?: string | null) {
  return origin?.replace(/\/$/, "") ?? "";
}

export function buildCorsHeaders(request: NextRequest) {
  const requestOrigin = normalizeOrigin(request.headers.get("origin"));
  const configuredOrigin = normalizeOrigin(process.env.CLIENT_ORIGIN);
  const allowOrigin = configuredOrigin || requestOrigin || "*";

  return {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Origin": allowOrigin,
    Vary: "Origin",
  };
}

export function withCors(request: NextRequest, response: NextResponse) {
  const headers = buildCorsHeaders(request);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
