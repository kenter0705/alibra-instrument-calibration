import { requestLink } from "@/lib/request-origin";
import { SESSION_COOKIE, appCookie } from "@/lib/app-edition";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APPROVAL_TICKET_SECONDS, hashPassword, makeApprovalTicket } from "@/lib/auth";
import { Prisma } from "@/generated/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const passwordConfirm = String(form.get("passwordConfirm") || "");
  const companyName = String(form.get("companyName") || "").trim();
  const department = String(form.get("department") || "").trim();
  const displayName = String(form.get("displayName") || "").trim();
  const employeeNo = String(form.get("employeeNo") || "").trim();
  const phone = String(form.get("phone") || "").trim();
  const destination = requestLink(request, "/signup");
  const fail = (message: string) => { destination.searchParams.set("error", message); return NextResponse.redirect(destination, 303); };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200 || !companyName || !department || !displayName || !employeeNo || !phone) return fail("이메일 주소와 모든 가입 정보를 확인해 주세요.");
  if (companyName.length > 120 || department.length > 120 || displayName.length > 80 || employeeNo.length > 80 || phone.length > 50) return fail("가입 정보의 입력 길이를 확인해 주세요.");
  if (password.length < 8 || password.length > 200) return fail("비밀번호는 8~200자로 입력해 주세요.");
  if (password !== passwordConfirm) return fail("비밀번호 확인이 일치하지 않습니다.");
  const duplicate = await prisma.userAccount.findFirst({ where: { OR: [{ email }, { username: email }, { employeeNo }] } });
  if (duplicate) return fail("이미 등록된 이메일 또는 사번입니다. 로그인하거나 관리자에게 문의해 주세요.");

  if (!process.env.AUTH_SECRET) return fail("앱 실행 보안 키가 없습니다. 바탕화면 바로가기로 다시 실행해 주세요.");
  if (await prisma.userAccount.count() === 0) return fail("설치 PC의 바탕화면 바로가기에서 첫 관리자를 먼저 등록해 주세요.");
  let account;
  try { account = await prisma.userAccount.create({ data: {
    username: email, email, displayName, companyName, department, employeeNo, phone,
    passwordHash: hashPassword(password), profileComplete: true, role: "가입 대기", active: false,
  } }); } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return fail("이미 등록된 이메일 또는 사번입니다. 로그인하거나 관리자에게 문의해 주세요.");
    throw error;
  }
  const response = NextResponse.redirect(requestLink(request, "/signup?submitted=1"), 303);
  response.cookies.set(appCookie("approval_ticket"), makeApprovalTicket(account.id), { httpOnly:true, secure:process.env.APP_HTTPS === "true", sameSite:"lax", path:"/", maxAge:APPROVAL_TICKET_SECONDS });
  return response;
}
