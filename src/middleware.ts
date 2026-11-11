import { validSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const COOKIE = "calibra_session";

export function middleware(request: NextRequest) {
  if (process.env.CALIBRA_PREVIEW_MODE === "true") return NextResponse.next();

  const path = request.nextUrl.pathname;
  const authPage = path === "/login" || path === "/signup";
  const publicRoute = authPage || path === "/multi-user" || path === "/api/health" || path === "/api/network-settings" || path === "/api/education-data" || path.startsWith("/api/education-data/") ||
    path === "/api/auth/password" ||
    path === "/api/auth/google" || path === "/api/auth/google/callback";
  const token = request.cookies.get(COOKIE)?.value;
  const authenticated = Boolean(token && validSession(token));

  if (!authenticated && !publicRoute) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (authenticated && authPage) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
