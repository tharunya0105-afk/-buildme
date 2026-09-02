import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // Allow auth pages and public API routes
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const role = token.role as string;

  // Protect engineer-only routes
  if (pathname.startsWith("/engineer")) {
    if (role !== "engineer") {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // Protect homeowner-only routes
  if (pathname.startsWith("/homeowner")) {
    if (role !== "homeowner") {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/engineer/:path*",
    "/homeowner/:path*",
    "/api/projects/:path*",
    "/api/workers/:path*",
    "/api/workforce/:path*",
    "/api/command-center/:path*",
    "/api/pilots/:path*",
    "/api/homeowner/:path*",
    "/api/dashboard/:path*",
    "/api/ai/:path*",
    "/api/inspections/:path*",
    "/api/issues/:path*",
    "/api/spatial/:path*",
    "/api/cost-estimates/:path*",
    "/api/commercialization/:path*",
    "/api/validation/:path*",
    "/api/analytics/:path*",
    "/api/alerts/:path*",
  ],
};
