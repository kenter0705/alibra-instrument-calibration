"use client";
import { useEffect, useState } from "react";

export default function ApprovalStatus() {
  const [message, setMessage] = useState("승인 여부를 확인하고 있습니다. 승인되면 자동으로 홈 화면으로 이동합니다.");
  useEffect(() => {
    let alive = true;
    let busy = false;
    const check = async () => {
      if (busy) return;
      busy = true;
      try {
        const response = await fetch("/api/auth/approval-status", { cache: "no-store" });
        const data = await response.json();
        if (!alive) return;
        if (data.state === "approved") { window.location.assign(data.redirect || "/"); return; }
        if (data.state === "disabled") setMessage("계정이 중지되어 로그인할 수 없습니다. 관리자에게 문의해 주세요.");
        if (data.state === "expired") setMessage("승인 확인 시간이 만료되었습니다. 승인 후 로그인 화면에서 다시 로그인해 주세요.");
        if (data.state === "setup-error") setMessage("로그인 보안 설정을 확인할 수 없습니다. 앱 관리자에게 문의해 주세요.");
      } catch { if (alive) setMessage("승인 상태 확인을 다시 시도하고 있습니다."); }
      finally { busy = false; }
    };
    void check();
    const timer = window.setInterval(check, 2500);
    return () => { alive = false; window.clearInterval(timer); };
  }, []);
  return <span>{message}</span>;
}
