import Link from "next/link";
import { ArrowLeft,ClipboardCheck,Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/print-button";
export const dynamic="force-dynamic";
const date=(d:Date|null)=>d?new Intl.DateTimeFormat("ko-KR").format(d):"—";
const won=(n:number|null)=>n==null?"—":`${n.toLocaleString("ko-KR")}원`;
export default async function PurchasesPage(){
 const items=await prisma.purchaseRequest.findMany({orderBy:{requestedAt:"desc"}});
 return <main className="record-page"><header className="record-top"><Link href="/" className="back-link"><ArrowLeft size={16}/> 대시보드</Link><PrintButton label="인쇄 미리보기 / 인쇄" icon/></header><section className="record-content"><div className="page-heading"><div><span className="eyebrow">PURCHASE REQUEST REVIEW</span><h1>계측기 구매 검토서</h1><p>구매 필요성·요구 사양·예산과 처리 상태를 품의 자료로 관리합니다.</p></div><Link className="primary-button" href="/purchases/new" target="_blank" rel="opener"><Plus size={14}/> 신규 구매 검토서</Link></div>
 <section className="panel purchase-review-guide"><div><ClipboardCheck size={19}/><h2>검토 시 확인할 항목</h2></div><ul><li>구매 목적과 현 보유 계측기로 대체 가능한지 확인</li><li>측정범위·정확도·단위 등 필요한 사양과 교정 필요 여부 확인</li><li>수량·견적·예산 근거 및 구매 후 관리부서·보관 위치 확인</li></ul><p>이 화면은 구매 검토 기록을 보존합니다. 결재 승인 또는 발주 완료로 자동 간주하지 않습니다.</p></section>
 <section className="panel"><div className="panel-head"><div><h2>구매 검토 목록</h2><p>{items.length}건 · 요청서와 예산·실구매 금액을 조회하고 수정할 수 있습니다.</p></div></div><div className="table-wrap"><table><thead><tr><th>문서번호</th><th>요청일 · 요청자</th><th>품목 / 분류</th><th>부서 / 수량</th><th>예상·승인·실구매</th><th>상태</th><th>관리</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td className="code">{x.requestNumber}</td><td>{date(x.requestedAt)}<small className="block-small">{x.requestedBy}</small></td><td>{x.itemName}<small className="block-small">{x.category}</small></td><td>{x.department} · {x.quantity}</td><td>{won(x.estimatedCost)}<small className="block-small">승인 {won(x.approvedCost)} · 실구매 {won(x.actualCost)}</small></td><td><span className={`status ${x.status==="구매 완료"?"ok":x.status==="반려"?"expired":"warning"}`}>{x.status}</span></td><td><Link className="table-action" href={`/purchases/${x.id}`} target="_blank" rel="opener">상세·수정</Link></td></tr>)}{!items.length&&<tr><td colSpan={7}>구매 검토서가 없습니다. 신규 구매 검토서에서 등록하세요.</td></tr>}</tbody></table></div></section></section></main>
}
