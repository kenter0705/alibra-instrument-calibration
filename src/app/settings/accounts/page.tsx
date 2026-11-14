import { SESSION_COOKIE } from "@/lib/app-edition";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, UserCheck, UserRound, UserX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { validSession } from "@/lib/auth";
import { changeAccountStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountManagementPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { saved, error } = await searchParams;
  const token = (await cookies()).get(SESSION_COOKIE)?.value || "";
  if (!validSession(token)) redirect("/login");
  const actor = await prisma.userAccount.findUnique({ where: { id: token.split(".")[0] } });
  if (!actor?.active) redirect("/login");
  if (actor.role !== "관리자") redirect("/account?error=%EA%B4%80%EB%A6%AC%EC%9E%90%EB%A7%8C%20%EC%82%AC%EC%9A%A9%EC%9E%90%20%EC%8A%B9%EC%9D%B8%EC%9D%84%20%EA%B4%80%EB%A6%AC%ED%95%A0%20%EC%88%98%20%EC%9E%88%EC%8A%B5%EB%8B%88%EB%8B%A4");
  const users = await prisma.userAccount.findMany({ orderBy: [{ active: "asc" }, { createdAt: "desc" }] });

  return <main className="record-page"><header className="record-top"><Link href="/settings" className="back-link"><ArrowLeft size={16}/> 시스템 설정</Link></header><section className="record-content">
    <div className="page-heading"><div><span className="eyebrow">ACCOUNT ADMINISTRATION</span><h1>가입·탈퇴 및 사용자 관리</h1><p>가입 신청을 승인하거나 계정을 중지합니다. 계정 상태를 바꾸어도 업무 데이터와 기록은 삭제되지 않습니다.</p></div></div>
    {saved && <p className="signup-success" role="status">계정 상태가 저장되었습니다.</p>}{error && <p className="auth-error" role="alert">{decodeURIComponent(error)}</p>}
    <section className="panel"><div className="panel-head"><div><h2>사용자 계정</h2><p>전체 {users.length}명 · 승인 대기 {users.filter(user => user.role === "가입 대기").length}명</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>이름 / 로그인 이메일</th><th>회사 · 부서</th><th>사번 · 전화번호</th><th>가입일</th><th>상태</th><th>관리</th></tr></thead><tbody>{users.map(user => <tr key={user.id}>
        <td><strong>{user.displayName}</strong><small className="account-secondary">{user.email || user.username}{user.googleSubject ? " · Google" : " · 이메일/비밀번호"}</small></td>
        <td>{user.companyName || "미입력"}<small className="account-secondary">{user.department || "부서 미입력"}</small></td>
        <td>{user.employeeNo || "미입력"}<small className="account-secondary">{user.phone || "전화번호 미입력"}</small></td>
        <td>{new Intl.DateTimeFormat("ko-KR").format(user.createdAt)}</td>
        <td><span className={`account-status ${user.active ? "active" : "inactive"}`}>{user.active ? (user.role === "관리자" ? "관리자" : "사용 중") : (user.role === "가입 대기" ? "승인 대기" : user.role === "탈퇴" ? "탈퇴" : "중지")}</span></td>
        <td>{user.id === actor.id ? <span className="account-secondary">현재 계정</span> : <div className="account-actions">
          {!user.active && user.role === "가입 대기" && <form action={changeAccountStatus}><input type="hidden" name="id" value={user.id}/><input type="hidden" name="operation" value="approve"/><button className="secondary-button"><UserCheck size={14}/> 승인</button></form>}
          {user.active && <form action={changeAccountStatus}><input type="hidden" name="id" value={user.id}/><input type="hidden" name="operation" value="suspend"/><button className="delete-button"><UserX size={14}/> 중지</button></form>}
          {!user.active && user.role !== "가입 대기" && user.role !== "탈퇴" && <form action={changeAccountStatus}><input type="hidden" name="id" value={user.id}/><input type="hidden" name="operation" value="restore"/><button className="secondary-button"><UserRound size={14}/> 복구</button></form>}
        </div>}</td>
      </tr>)}</tbody></table>{users.length === 0 && <div className="empty-state">등록된 계정이 없습니다.</div>}</div>
    </section><p className="page-note">탈퇴 또는 중지는 로그인만 제한합니다. 데이터베이스의 계측기·검교정·분석 기록은 보존됩니다.</p>
  </section></main>;
}
