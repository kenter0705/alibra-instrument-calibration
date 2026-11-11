import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Gauge, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/print-button";
import InstrumentImport from "@/components/instrument-import";
import InstrumentRowEdit from "@/components/instrument-row-edit";
import InstrumentDefaultImage from "@/components/instrument-default-image";

export const dynamic = "force-dynamic";

type Search={classification?:string;q?:string;department?:string;status?:string};
export default async function InstrumentsPage({searchParams}:{searchParams:Promise<Search>}) {
  const query=await searchParams;const classification=query.classification??"all";const search=(query.q??"").trim().toLowerCase();const department=(query.department??"").trim();const statusFilter=query.status??"";const today=new Date();const dueSoonLimit=new Date(today.getTime()+30*86_400_000);
  const allInstruments = await prisma.instrument.findMany({ orderBy: { assetCode: "asc" } });
  const counts={all:allInstruments.length,holding:allInstruments.filter(x=>!['분실','폐기'].includes(x.status)).length,requested:allInstruments.filter(x=>['검교정 의뢰','교정 중'].includes(x.status)).length,lost:allInstruments.filter(x=>x.status==='분실').length,disposed:allInstruments.filter(x=>x.status==='폐기').length};
  const instruments=allInstruments.filter(item=>{
    const classified=classification==="holding"?!["분실","폐기"].includes(item.status):classification==="requested"?["검교정 의뢰","교정 중"].includes(item.status):classification==="lost"?item.status==="분실":classification==="disposed"?item.status==="폐기":true;
    const matches=!search||[item.assetCode,item.name,item.manufacturer,item.model,item.department,item.owner].some(v=>v.toLowerCase().includes(search));const statusMatches=statusFilter==="overdue"?item.dueDate<today:statusFilter==="dueSoon"?item.dueDate>=today&&item.dueDate<=dueSoonLimit:statusFilter==="normal"?item.dueDate>dueSoonLimit:!statusFilter;return classified&&matches&&(!department||item.department===department)&&statusMatches;
  });
  const filterTabs=[{key:"all",label:"전체 목록",count:counts.all},{key:"holding",label:"보유",count:counts.holding},{key:"requested",label:"검교정 의뢰",count:counts.requested},{key:"lost",label:"분실",count:counts.lost},{key:"disposed",label:"폐기",count:counts.disposed}];
  return <main className="record-page">
    <header className="record-top"><Link href="/" className="back-link"><ArrowLeft size={16}/> 대시보드</Link><div className="record-actions"><Link href="/instruments/departments" className="secondary-button">부서별 현황</Link><PrintButton label="인쇄 미리보기 / 인쇄" icon/></div></header>
    <section className="record-content">
      <div className="page-heading"><div><span className="eyebrow">ASSET MANAGEMENT</span><h1>계측기 관리 대장</h1><p>전체 {allInstruments.length}대 중 {instruments.length}대 표시 · 행 또는 이름을 선택하면 상세 대장이 새 창에서 열립니다.</p></div><form className="instrument-search-form" method="get"><Search size={15}/><input name="q" defaultValue={query.q??""} placeholder="관리번호, 계측기명, 제조사 검색"/><input type="hidden" name="classification" value={classification}/>{department&&<input type="hidden" name="department" value={department}/>}<button className="secondary-button" type="submit">검색 실행</button></form></div>
      <nav className="instrument-filter-tabs" aria-label="계측기 상태 분류">{filterTabs.map(tab=><Link key={tab.key} href={`/instruments?classification=${tab.key}${query.q?`&q=${encodeURIComponent(query.q)}`:""}${department?`&department=${encodeURIComponent(department)}`:""}`} className={classification===tab.key?"selected":""}>{tab.label}<span>{tab.count}</span></Link>)}</nav>
      {(department||query.q||classification!=="all"||statusFilter)&&<div className="instrument-result-bar"><span>{department&&<>부서 <strong>{department}</strong> · </>}{query.q&&<>검색어 <strong>“{query.q}”</strong> · </>}{statusFilter&&<>상태 <strong>{{overdue:"검교정 지연",dueSoon:"검교정 임박",normal:"검교정 정상"}[statusFilter]??statusFilter}</strong> · </>}{filterTabs.find(tab=>tab.key===classification)?.label} <strong>{instruments.length}대</strong></span><Link className="secondary-button" href="/instruments">전체 보기</Link></div>}
      <div className="print-title"><h2>계측기 관리 대장</h2><p>CALIBRA · 출력일 {new Intl.DateTimeFormat("ko-KR").format(new Date())}</p></div>
      <InstrumentImport/>
      <div className="table-wrap panel instrument-list"><table><thead><tr><th>관리번호</th><th>계측기명 / 모델</th><th>바코드 번호</th><th>분류</th><th>측정 범위 / 단위</th><th>위치</th><th>담당 부서</th><th>교정 예정일</th><th>상태</th><th>상세</th></tr></thead><tbody>{instruments.map(item => {
        const days = Math.ceil((item.dueDate.getTime()-Date.now())/86_400_000);
        const status = ["정상","임박","만료"].includes(item.status) ? (days < 0 ? "만료" : days <= 30 ? "임박" : "정상") : item.status;
        return <tr key={item.id}>
          <td className="code">{item.assetCode}</td>
          <td><Link href={`/instruments/${item.id}`} target="_blank" rel="opener" className="instrument-name instrument-link"><span className="instrument-icon instrument-list-photo">{item.photoPath?<img src={`/api/instrument-photo/${item.id}?slot=rep`} alt=""/>:<InstrumentDefaultImage category={item.category} compact/>}</span><span><strong>{item.name}</strong><small>{item.manufacturer} · {item.model}</small></span><ArrowUpRight size={12}/></Link></td>
          <td className="code">{item.barcodeNumber ?? "미발급"}</td><td>{item.category}</td><td>{item.measurementRange||"범위 미등록"} {item.measurementUnit}</td><td>{item.location}</td><td>{item.department}</td><td>{new Intl.DateTimeFormat("ko-KR", {year:"numeric",month:"2-digit",day:"2-digit"}).format(item.dueDate)}</td>
          <td><span className={`status ${["정상","사용 중"].includes(status) ? "ok" : status === "임박"||status==="검교정 의뢰"||status==="교정 중" ? "warning" : ["만료","분실","폐기"].includes(status) ? "expired":"neutral"}`}><i/>{status}</span></td><td><Link className="table-action" target="_blank" rel="opener" href={`/instruments/${item.id}`}>대장 보기</Link><InstrumentRowEdit id={item.id} location={item.location} department={item.department} owner={item.owner} status={item.status}/></td>
        </tr>;
      })}</tbody></table>{!instruments.length && <div className="empty-state">등록된 계측기가 없습니다.</div>}</div>
      <p className="page-note">현재 DB에 등록된 자산 전부를 표시합니다. 회사의 검교정 대상 목록을 가져오려면 엑셀 원본을 전달해 주세요.</p>
    </section>
  </main>;
}
