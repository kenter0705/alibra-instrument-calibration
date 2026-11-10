import { Gauge, KeyRound, LogIn, MailCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="auth-brand"><Gauge size={22} /><span>CALIBRA</span></div>
        <span className="eyebrow">CALIBRA ACCOUNT</span>
        <h1>로그인</h1>
        <p>등록된 이메일 주소와 비밀번호를 입력하세요.</p>
        {error && <div className="auth-error">{decodeURIComponent(error)}</div>}
        <form action="/api/auth/password" method="post" className="auth-form">
          <label>이메일 주소<input type="email" name="email" autoComplete="username" placeholder="name@example.com" required /></label>
          <label>비밀번호<input type="password" name="password" autoComplete="current-password" placeholder="비밀번호" required /></label>
          <button className="primary-button"><KeyRound size={15} /> 이메일과 비밀번호로 로그인</button>
        </form>
        {googleReady ? (
          <><div className="auth-divider">또는</div>
          <a className="google-login-button" href="/api/auth/google"><b>G</b><LogIn size={16} /> Google 이메일로 로그인</a>
          </>
        ) : (
          <div className="google-setup-note">
            <MailCheck size={18} />
            <span>Google 이메일 인증 로그인은 OAuth 설정이 완료된 경우 사용할 수 있습니다.</span>
          </div>
        )}
        <small>계정은 이메일 인증 후 사용할 수 있습니다. 로컬 업무 데이터는 이 PC에 저장됩니다.</small>
      </section>
    </main>
  );
}
