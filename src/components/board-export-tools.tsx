"use client";
import { usePathname } from "next/navigation";
import { useEffect,useState } from "react";
import { exportBoards,type ExportBoard } from "@/lib/board-export-definitions";
const contexts:[string,ExportBoard][]=[["/training/materials","training-materials"],["/training","training-courses"],["/special-process","qualifications"],["/instruments/departments","locations"],["/instruments","instruments"],["/calibrations","calibrations"],["/purchases","purchases"],["/issues","issues"],["/disposals","disposals"],["/approvals","approvals"],["/providers","providers"],["/procedures","procedures"],["/quality","spc"],["/grr","grr"],["/costs","budgets"],["/shared-data","shared-data"]];
export default function BoardExportTools(){
 const pathname=usePathname();const [recordId,setRecordId]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const context=contexts.find(([prefix])=>pathname===prefix||pathname.startsWith(prefix+"/"));
 useEffect(()=>{const parts=pathname.split("/");const query=new URLSearchParams(window.location.search);const last=parts.find(part=>/^[a-z0-9-]{20,40}$/i.test(part));setRecordId(pathname.endsWith("/manual")?"":query.get("edit")||last||"");setMessage("")},[pathname]);
 if(!context)return null;const [,board]=context;
 async function download(format:"xlsx"|"pdf"){
  setBusy(true);setMessage("");try{
   const response=await fetch(`/api/board-export/${board}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({format,...(recordId?{ids:[recordId]}:{all:true})})});
   if(!response.ok){const data=await response.json();throw new Error(data.error||"문서 변환에 실패했습니다.")}
   const blob=await response.blob(),encoded=response.headers.get("content-disposition")?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
   const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=encoded?decodeURIComponent(encoded):`CALIBRA-${board}.${format}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   setMessage(`${response.headers.get("x-export-count")}건을 ${format==="xlsx"?"엑셀":"PDF"}로 내려받았습니다.`);
  }catch(error){setMessage(error instanceof Error?error.message:"내려받기 실패")}finally{setBusy(false)}
 }
 return <aside className="board-export-tools no-print" aria-label="게시판 엑셀 PDF 다운로드"><strong>{exportBoards[board].title}</strong><span>{recordId?"현재 게시글":"전체 등록글 · 모든 페이지 포함"}</span><div className="board-export-buttons"><button type="button" className="export-excel" disabled={busy} onClick={()=>download("xlsx")}>{busy?"변환 중…":recordId?"엑셀 다운로드":"엑셀 일괄 다운로드"}</button><button type="button" className="export-pdf" disabled={busy} onClick={()=>download("pdf")}>{busy?"변환 중…":recordId?"PDF 다운로드":"PDF 일괄 다운로드"}</button><a href={`/exports?board=${board}${recordId?`&id=${encodeURIComponent(recordId)}`:""}`}>개별·선택·전체 내려받기</a></div>{message&&<p role="status" aria-live="polite">{message}</p>}</aside>
}
