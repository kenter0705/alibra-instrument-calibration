import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { makeSession, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
const cookieName = "calibra_session";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const loginUrl = new URL("/login", request.url);

  if (!email || !password) {
    loginUrl.searchParams.set("error", "이메일 주소와 비밀번호를 입력해 주세요.");
    return NextResponse.redirect(loginUrl, 303);
  }

  const account = await prisma.userAccount.findFirst({
    where: { OR: [{ email }, { username: email }] },
  });
  if (!account || !account.active || !verifyPassword(password, account.passwordHash)) {
    loginUrl.searchParams.set("error", "이메일 주소 또는 비밀번호를 확인해 주세요.");
    return NextResponse.redirect(loginUrl, 303);
  }
  if (!process.env.AUTH_SECRET) {
    loginUrl.searchParams.set("error", "로그인 보안 키가 없습니다. CALIBRA 바로가기로 앱을 실행해 주세요.");
    return NextResponse.redirect(loginUrl, 303);
  }

  const response = NextResponse.redirect(new URL(account.profileComplete ? "/quality" : "/account/profile", request.url), 303);
  response.cookies.set(cookieName, makeSession(account.id), {
    httpOnly: true,
    secure: process.env.APP_HTTPS === "true",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return response;
}
