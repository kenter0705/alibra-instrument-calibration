import Link from "next/link";
import { Gauge, KeyRound, UserPlus } from "lucide-react";
import ApprovalStatus from "@/app/login/ApprovalStatus";

export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string }> }) {
  const { error, submitted } = await searchParams;
  return <main className="auth-screen"><section className="auth-card">
    <div className="auth-brand"><Gauge size={22}/><span>CALIBRA</span></div>
    <span className="eyebrow">CALIBRA ACCOUNT</span>
    <h1>계정 가입 신청</h1>
    <p>신청 정보를 등록하면 관리자가 확인 후 계정을 승인합니다.</p>
    <div className="auth-tabs"><Link href="/login">로그인</Link><Link href="/signup" aria-current="page">회원 가입</Link></div>
    {submitted && <div className="signup-success" role="status"><strong>가입 신청이 등록되었습니다.</strong><ApprovalStatus/></div>}
    {error && <div className="auth-error" role="alert">{decodeURIComponent(error)}</div>}
    <form action="/api/auth/signup" method="post" className="auth-form signup-form">
      <label>로그인 이메일<input type="email" name="email" autoComplete="email" placeholder="name@example.com" required/></label>
      <label>비밀번호<input type="password" name="password" autoComplete="new-password" minLength={8} placeholder="8자 이상" required/></label>
      <label>비밀번호 확인<input type="password" name="passwordConfirm" autoComplete="new-password" minLength={8} placeholder="비밀번호 다시 입력" required/></label>
      <label>회사명<input name="companyName" placeholder="회사명" required/></label>
      <label>소속 부서<input name="department" placeholder="부서명" required/></label>
      <label>이름<input name="displayName" autoComplete="name" placeholder="이름" required/></label>
      <label>사번<input name="employeeNo" placeholder="사번" required/></label>
      <label>전화번호<input name="phone" autoComplete="tel" placeholder="전화번호" required/></label>
      <button className="primary-button"><UserPlus size={15}/> 가입 신청</button>
    </form>
    <div className="auth-divider">또는 Google 계정으로 신청</div>
    <a className="google-login-button" href="/api/auth/google?login_hint=kenter6746060%40gmail.com"><b>G</b><KeyRound size={15}/> Google 계정으로 계속</a>
    <small>Google 로그인은 이메일을 확인합니다. 새 계정은 첫 관리자 계정인 경우 외에는 관리자 승인 후 사용할 수 있습니다.</small>
  </section></main>;
}
