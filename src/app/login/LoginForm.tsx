"use client";
import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, Save } from "lucide-react";

const EMAIL_KEY = "calibra-login-email";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    const saved = window.localStorage.getItem(EMAIL_KEY);
    if (saved) { setEmail(saved); setEmailSaved(true); }
  }, []);
  function saveEmail() {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;
    window.localStorage.setItem(EMAIL_KEY, normalized);
    setEmail(normalized);
    setEmailSaved(true);
  }
  function rememberForLogin() {
    if (email.trim()) {
      window.localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
      setEmailSaved(true);
    }
  }

  return <form action="/api/auth/password" method="post" className="auth-form" onSubmit={rememberForLogin}>
    <label>이메일 주소
      <span className="email-save-row">
        <input type="email" name="email" autoComplete="username" value={email} onChange={event => { setEmail(event.target.value); setEmailSaved(false); }} placeholder="name@example.com" required/>
        <button type="button" className="secondary-button email-save-button" onClick={saveEmail}><Save size={15}/>{emailSaved ? "저장됨" : "이메일 저장"}</button>
      </span>
    </label>
    <label>비밀번호<span className="password-field"><input type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" placeholder="비밀번호" required/><button type="button" className="password-visibility" aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></span></label>
    <button className="primary-button"><KeyRound size={15}/> 이메일과 비밀번호로 로그인</button>
    <small className="password-storage-note"><Check size={14}/> 비밀번호는 안전한 해시로 확인하며, 로그인 유지 정보는 이 PC의 보호된 세션 쿠키에 저장합니다. 브라우저 암호 저장도 사용할 수 있습니다.</small>
  </form>;
}
