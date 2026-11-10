"use client";
import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
export default function HomeShareLink(){const [copied,setCopied]=useState(false);const home=typeof window==="undefined"?"http://localhost:3000/":`${window.location.origin}/`;async function copy(){try{await navigator.clipboard.writeText(home);setCopied(true);window.setTimeout(()=>setCopied(false),1800)}catch{setCopied(false)}}return <div className="home-share-link"><div><span className="eyebrow">HOME ACCESS URL</span><strong>{home}</strong><small>이 PC에서 앱 서버가 실행 중일 때 홈 화면을 엽니다.</small></div><button type="button" className="secondary-button" onClick={copy}><Copy size={14}/>{copied?"복사됨":"주소 복사"}</button><a className="secondary-button" href="/"><ExternalLink size={14}/> 홈 열기</a></div>}
