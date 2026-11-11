import Link from "next/link";
import { Gauge, LogIn, MailCheck } from "lucide-react";
import LoginForm from "./LoginForm";
import ApprovalStatus from "./ApprovalStatus";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; pending?: string; withdrawn?: string }> }) {
  const { error, pending, withdrawn } = await searchParams;
  const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="auth-brand"><Gauge size={22} /><span>CALIBRA</span></div>
        <span className="eyebrow">CALIBRA ACCOUNT</span>
        <h1>로그인</h1>
        <p>등록된 이메일 주소와 비밀번호를 입력하세요.</p>
        <div className="auth-tabs"><Link href="/login" aria-current="page">로그인</Link><Link href="/signup">회원 가입</Link></div>
        {pending && <div className="signup-success" role="status"><strong>관리자 승인 대기 중입니다.</strong><ApprovalStatus/></div>}
        {withdrawn && <div className="signup-success" role="status"><strong>탈퇴 처리가 완료되었습니다.</strong><span>계정 접속을 중지했습니다. 기존 업무 기록은 보존되어 있습니다.</span></div>}
        {error && <div className="auth-error">{decodeURIComponent(error)}</div>}
        <LoginForm />
        <div className="auth-divider">또는 Google 계정으로 접속</div>
        <a className="google-login-button" href="/api/auth/google?login_hint=kenter6746060%40gmail.com"><b>G</b><LogIn size={16} /> kenter6746060@gmail.com 으로 Google 로그인</a>
        {!googleReady && <div className="google-setup-note"><MailCheck size={18} /><span>이 PC 앱에 Google OAuth 클라이언트 설정이 연결되지 않았습니다. 계정의 승인을 다시 받을 문제가 아니라 앱 연결 설정 문제입니다.</span></div>}
        <small>가입 계정은 관리자 승인 후 사용할 수 있습니다. 로컬 업무 데이터는 이 PC에 저장됩니다.</small>
      </section>
    </main>
  );
}
