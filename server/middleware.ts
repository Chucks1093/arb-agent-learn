import { NextRequest, NextResponse } from "next/server";
import { buildCorsHeaders, withCors } from "@/lib/cors";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: buildCorsHeaders(request),
    });
  }

  return withCors(request, NextResponse.next());
}

export const config = {
  matcher: ["/api/:path*"],
};
