import { SESSION_COOKIE } from "@/lib/app-edition";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, UserRound, UserX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { validSession } from "@/lib/auth";
import { withdrawAccount } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const token = (await cookies()).get(SESSION_COOKIE)?.value || "";
  if (!validSession(token)) redirect("/login");
  const user = await prisma.userAccount.findUnique({ where: { id: token.split(".")[0] } });
  if (!user?.active) redirect("/login");
  return <main className="record-page"><header className="record-top"><Link href="/" className="back-link"><ArrowLeft size={16}/> 홈 대시보드</Link></header><section className="record-content">
    <div className="page-heading"><div><span className="eyebrow">CALIBRA ACCOUNT</span><h1>내 계정</h1><p>현재 로그인 계정의 정보와 가입 상태를 확인합니다.</p></div></div>
    {error && <p className="auth-error" role="alert">{decodeURIComponent(error)}</p>}
    <section className="panel account-profile"><div className="account-profile-icon"><UserRound/></div><div><h2>{user.displayName}</h2><p>{user.email || user.username} · {user.role}</p><dl><div><dt>회사</dt><dd>{user.companyName || "미입력"}</dd></div><div><dt>부서</dt><dd>{user.department || "미입력"}</dd></div><div><dt>사번</dt><dd>{user.employeeNo || "미입력"}</dd></div><div><dt>전화번호</dt><dd>{user.phone || "미입력"}</dd></div></dl></div></section>
    <section className="panel account-withdraw"><div><h2>회원 탈퇴</h2><p>탈퇴하면 이메일·가입정보·로그인 자격정보를 삭제합니다. 계측기와 업무 이력은 유지됩니다.</p></div><form action={withdrawAccount}><button className="delete-button"><UserX size={15}/> 탈퇴 및 계정정보 삭제</button></form></section>
  </section></main>;
}
