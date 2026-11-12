import { requestLink } from "@/lib/request-origin";
import { SESSION_COOKIE, appCookie } from "@/lib/app-edition";
import { validSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const COOKIE = SESSION_COOKIE;

export async function middleware(request: NextRequest) {
  if (process.env.CALIBRA_PREVIEW_MODE === "true") return NextResponse.next();

  const path = request.nextUrl.pathname;
  const authPage = path === "/login" || path === "/signup";
  const publicAsset = new Set(["/favicon.ico", "/calibra.ico", "/calibra-icon.png", "/calibra-icon.svg", "/manifest.webmanifest", "/quality-state-gauge.png", "/angbu-ilgu.svg", "/angbu-ilgu-home.svg", "/pressure-calibration-setup.svg"]).has(path);
  const publicRoute = publicAsset || authPage || path === "/setup" || path === "/api/setup" || path === "/multi-user" || path === "/api/health" || path === "/api/network-settings" || path === "/api/education-data" || path.startsWith("/api/education-data/") || path.startsWith("/api/board-export/") ||
    path === "/api/auth/approval-status" ||
    path === "/api/auth/password" || path === "/api/auth/signup" ||
    path === "/api/auth/google" || path === "/api/auth/google/callback";
  const token = request.cookies.get(COOKIE)?.value;
  let authenticated = false;
  if (token && validSession(token)) {
    try { authenticated = Boolean((await prisma.userAccount.findUnique({ where: { id: token.split(".")[0] }, select: { active: true } }))?.active); }
    catch { return new NextResponse("가입정보 저장소에 연결할 수 없습니다. 앱을 다시 실행해 주세요.", { status: 503 }); }
  }

  if (!authenticated && !publicRoute) {
    if (path.startsWith("/api/")) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    const url = requestLink(request, "/login");
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (authenticated && authPage) return NextResponse.redirect(requestLink(request, "/"));
  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  // Dataset routes authenticate the active account and check Origin themselves.
  // Avoid cloning their multipart uploads through middleware: Node's request
  // stream may already be consumed when Next creates the route Request.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/education-data(?:/|$)).*)"],
};
