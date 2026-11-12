import { SESSION_COOKIE, appCookie } from "@/lib/app-edition";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APPROVAL_TICKET_SECONDS, makeSession, SESSION_DURATION_SECONDS, validApprovalTicket } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const jar = await cookies();
  const ticket = jar.get(appCookie("approval_ticket"))?.value || "";
  if (!validApprovalTicket(ticket)) return NextResponse.json({ state: "expired" }, { status: 401 });
  const user = await prisma.userAccount.findUnique({ where: { id: ticket.split(".")[0] } });
  if (!user) return NextResponse.json({ state: "expired" }, { status: 401 });
  if (!user.active) return NextResponse.json({ state: user.role === "가입 대기" ? "pending" : "disabled" });
  if (!process.env.AUTH_SECRET) return NextResponse.json({ state: "setup-error" }, { status: 503 });
  // Approval completes the pending login flow; land on the app home immediately.
  const response = NextResponse.json({ state: "approved", redirect: "/" });
  response.cookies.set(SESSION_COOKIE, makeSession(user.id), { httpOnly:true, secure:process.env.APP_HTTPS === "true", sameSite:"lax", path:"/", maxAge:SESSION_DURATION_SECONDS });
  response.cookies.set(appCookie("approval_ticket"), "", { httpOnly:true, secure:process.env.APP_HTTPS === "true", sameSite:"lax", path:"/", maxAge:0 });
  return response;
}
