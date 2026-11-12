"use client";
import { useEffect, useState, type FormEvent } from "react";
import { serverAddress } from "@/lib/server-address";

type ServerInfo = { local: boolean; enabled: boolean; running: boolean; addresses: string[]; supported: boolean };
const STORAGE = "calibra.sharedServer";

export default function MultiUserSettings() {
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try { setAddress(localStorage.getItem(STORAGE) || window.location.host); } catch { setAddress(window.location.host); }
    const controller = new AbortController();
    fetch("/api/network-settings", { signal: controller.signal }).then(async response => {
      if (!response.ok) return;
      const data: ServerInfo = await response.json(); setInfo(data); setEnabled(data.enabled);
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  function connect(event: FormEvent) {
    event.preventDefault(); setMessage("");
    try {
      const destination = serverAddress(address);
      try { localStorage.setItem(STORAGE, destination); } catch { throw new Error("브라우저에서 주소를 저장하지 못했습니다. 사이트 저장소를 허용한 뒤 다시 시도하세요."); }
      window.location.assign(destination);
    } catch (error) { setMessage(error instanceof Error ? error.message : "주소를 확인하세요."); }
  }
  async function saveSharing(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/network-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "설정을 저장하지 못했습니다.");
      setMessage("설정을 저장했습니다. 이 PC의 CALIBRA 바로가기를 다시 실행하면 적용됩니다. 브라우저 새로고침만으로 서버 실행 설정은 바뀌지 않습니다.");
      setInfo(previous => previous ? { ...previous, enabled } : previous);
    } catch (error) { setMessage(error instanceof Error ? error.message : "설정 저장 실패"); }
    finally { setBusy(false); }
  }
  return <div className="network-settings">
    <section className="panel"><h2>서버 IP 주소 등록</h2><form onSubmit={connect} className="network-connect-form"><label htmlFor="shared-server">서버 PC의 IP 주소 · 포트</label><input id="shared-server" value={address} onChange={event => setAddress(event.target.value)} placeholder="192.168.0.10:4000" autoComplete="off" required/><small>IP만 입력하면 4000번 포트를 사용합니다. 저장하면 해당 서버의 홈 화면을 새로 엽니다.</small><button className="primary-button" type="submit">저장하고 새로고침</button></form><p>이 주소는 현재 브라우저에 저장됩니다. 서버가 다른 PC에 있으면 localhost 대신 서버 PC의 IP를 입력하세요.</p></section>
    <section className="panel"><h2>이 PC를 공유 서버로 사용</h2>{info?.local ? <><p>관리자가 서버 PC에서 설정합니다. 현재 상태: <strong>{info.running ? "사내망 공유 실행 중" : "이 PC에서만 접속 가능"}</strong></p>{info.addresses.length > 0 && <div className="network-addresses"><span>이 PC의 접속 주소</span>{info.addresses.map(url => <button type="button" key={url} onClick={() => setAddress(url)} className="secondary-button">{url}</button>)}</div>}{info.supported ? <form onSubmit={saveSharing}><label className="network-checkbox"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)}/> 사내망에서 이 PC에 접속 허용</label><button type="submit" className="secondary-button" disabled={busy}>{busy ? "저장 중…" : "공유 설정 저장"}</button></form> : <p>공유 서버 설정을 적용하려면 최신 Windows 설치 ZIP으로 업데이트 설치하세요. 기존 자료는 유지됩니다.</p>}</> : <p>서버 PC의 localhost 주소에서 관리자 로그인 후 공유 설정을 변경할 수 있습니다. 다른 PC에서는 위 IP 주소 등록을 이용하세요.</p>}</section>
    {message && <p className="standard-note" role="status" aria-live="polite">{message}</p>}
  </div>;
}
