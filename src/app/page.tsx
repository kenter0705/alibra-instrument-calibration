import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CalendarDays, CheckCircle2, ChevronDown, CircleAlert, ClipboardCheck, Clock3, FileText, Gauge, LayoutDashboard, Search, Settings2, ShieldCheck, Wrench } from "lucide-react";
import { getDashboardData } from "@/lib/instruments";
import { signOut } from "@/app/auth-actions";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import QcToolsVisual from "@/components/qc-tools-visual";

export const dynamic = "force-dynamic";

const menu = [
  { label: "대시보드", icon: LayoutDashboard, active: true, href:"/" },
  { label: "계측기 관리", icon: Gauge, href: "/instruments" }, { label: "검교정 계획", icon: CalendarDays, href: "/calendar" },
  { label: "검교정 이력", icon: ClipboardCheck, href:"/calibrations" }, { label: "구매 관리", icon: Activity, href:"/purchases" },
  { label: "불출 및 반납", icon: ArrowUpRight, href:"/issues" }, { label: "분실 및 폐기 관리", icon: CircleAlert, href:"/disposals" },
  { label: "비용 및 예산 관리", icon: Activity, href:"/costs" }, { label: "전자결재", icon: CheckCircle2, href:"/approvals" },
  { label: "측정시스템 분석(MSA)", icon: Activity, href:"/msa" },
  { label: "측정자 교육 관리", icon: ShieldCheck, href:"/training" }, { label: "교육 교재 게시판", icon: FileText, href:"/training/materials" }, { label: "절차서 관리", icon: ClipboardCheck, href:"/procedures" },
  { label: "특별특성 공정 자격인정", icon: ShieldCheck, href:"/special-process" },
  { label: "보고서", icon: ClipboardCheck, href:"/quality#report" }, { label: "시스템 설정", icon: Settings2, href:"/settings" },
  { label: "데이터 백업 및 복구", icon: ArrowDownRight, href:"/backup" }, { label: "설치 파일 다운로드", icon: ArrowDownRight, href:"/downloads" },
];

const dateText = (date: Date) => new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" }).format(date);

export default function Dashboard({searchParams}:{searchParams:Promise<{months?:string}>}) {
  return <Suspense fallback={<DashboardLoading/>}><DashboardReady searchParams={searchParams}/></Suspense>;
}

async function DashboardReady({searchParams}:{searchParams:Promise<{months?:string}>}) {
  const {months:requestedMonths}=await searchParams;
  const months=Number(requestedMonths);
  const monthCount=[3,6,9,12].includes(months)?months:6;
  const [data,qualificationSummary] = await Promise.all([getDashboardData(monthCount),prisma.processQualification.groupBy({by:["status"],_count:{_all:true}})]);
  const qualificationTotal=qualificationSummary.reduce((n,x)=>n+x._count._all,0);
  const qualificationCurrent=qualificationSummary.filter(x=>["유효","조건부 유효"].includes(x.status)).reduce((n,x)=>n+x._count._all,0);
  const certified = data.total - data.overdue;
  const awaiting = data.dueSoon + data.overdue;
  const monthlyMax = Math.max(1,...data.monthlyPlanVsActual.flatMap(item=>[item.planned,item.actual]));
  const plannedTotal=data.monthlyPlanVsActual.reduce((sum,item)=>sum+item.planned,0);
  const actualTotal=data.monthlyPlanVsActual.reduce((sum,item)=>sum+item.actual,0);
  const performance=plannedTotal?Math.round(actualTotal/plannedTotal*100):0;
  return <main className="shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="CALIBRA 홈"><div className="brand-mark"><img src="/angbu-ilgu.svg" alt="앙부일구 해시계"/></div><div><strong>CALIBRA</strong><small>계측기 통합관리</small></div></a>
      <div className="workspace"><span className="workspace-dot"/> 개인 작업공간 <ChevronDown size={14}/></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav>{menu.slice(0, 14).map(({label, icon: Icon, active, href}) => <a key={label} href={href ?? "/"} className={`nav-item ${active ? "active" : ""}`} data-label={label} title={label}><Icon size={17}/><span>{label}</span>{label === "검교정 계획" && data.dueSoon > 0 && <em>{data.dueSoon}</em>}</a>)}<details className="nav-accordion"><summary className="nav-item"><Wrench size={17}/><span>외부 검교정 관리</span><ChevronDown size={13}/></summary><div className="nav-subitems"><a href="/calibrations?route=external">외부 검교정 의뢰 이력</a><a href="/providers">검교정 기관 목록</a></div></details><details className="nav-accordion"><summary className="nav-item"><Activity size={17}/><span>통계적 공정관리</span><ChevronDown size={13}/></summary><div className="nav-subitems"><a href="/quality#qc7">QC 7가지 도구 · 교육 자료</a><a href="/quality#capability">공정능력 Cp · Cpk · Pp · Ppk</a><a href="/quality#qc7">관리도 데이터 50개</a><a href="/quality#qc7">정규 · Z · 포아송 · 카이제곱</a><a href="/quality#qc7">상관 · 회귀분석</a><a href="/quality#capability">분석 보고서 · 인쇄/PDF</a><a href="/grr">Gage R&amp;R · MSA</a></div></details>{menu.slice(14).map(({label, icon: Icon, active, href}) => <a key={label} href={href ?? "/"} className={`nav-item ${active ? "active" : ""}`} data-label={label} title={label}><Icon size={17}/><span>{label}</span></a>)}</nav>
      <div className="sidebar-bottom"><div className="avatar">관</div><div><strong>관리자</strong><small>로컬 사용자</small></div><form action={signOut}><button className="logout-button">로그아웃</button></form></div>
    </aside>

    <section className="main-area">
      <header className="topbar"><div className="crumb"><a href="/">워크스페이스</a> <span>/</span> <strong>대시보드</strong></div><div className="top-actions"><form className="search dashboard-search" action="/instruments" method="get"><Search size={16}/><input name="q" aria-label="계측기 검색" placeholder="계측기, 관리번호 검색"/><button type="submit" aria-label="검색 실행">검색</button></form><a className="icon-button" href="/calendar" aria-label="검교정 일정 알림"><Bell size={18}/><i/></a><a className="user-pill" href="/settings" aria-label="시스템 설정"><div className="avatar small">관</div><span>관리자</span><ChevronDown size={14}/></a></div></header>
      <div className="content">
        <div className="welcome-row"><div><div className="eyebrow">SUNDAY, NOVEMBER 08, 2026</div><div className="welcome-greeting-row"><h1>좋은 오후입니다, 관리자님</h1><QcToolsVisual/></div><p className="quality-motto">품질은 수치로 말한다. 정확한 측정과 통계적 관리가 품질의 기본 요건입니다.</p><p className="quality-quote"><span>“Quality is never an accident; it is always the result of intelligent effort.”</span><small>— John Ruskin</small></p><small className="dashboard-caption">오늘의 계측기 현황과 검교정 일정을 확인하세요.</small></div><a href="/calendar" className="date-button"><CalendarDays size={16}/> 검교정 일정 달력 <ChevronDown size={14}/></a></div>
        <section className="home-sundial-feature" aria-label="품질 상태 게이지 소개"><div className="home-sundial-copy"><span className="eyebrow">MEASURE · ANALYZE · IMPROVE</span><h2>품질은 수치로 말합니다</h2><p>측정 데이터와 통계적 공정관리로 공정 상태를 살피고, 개선 방향을 찾습니다.</p><a href="/quality">통계적 공정관리 열기 <ArrowRight size={14}/></a></div><img src="/quality-state-gauge.png" alt="불량·보통·양호 상태와 측정 바늘을 표현한 품질 게이지 일러스트"/></section>
        <div className="home-quick-links"><a className="home-training-shortcut" href="/training/materials"><span><FileText size={18}/></span><div><strong>통계적 공정관리 교육 교재</strong><small>이론 학습과 PDF·PPT 실습자료 목록을 엽니다.</small></div><ArrowRight size={16}/></a><a className="home-training-shortcut qualification-shortcut" href="/special-process"><span><ShieldCheck size={18}/></span><div><strong>특별특성 공정 자격인정 현황</strong><small>전체 {qualificationTotal}건 · 유효·조건부 유효 {qualificationCurrent}건</small></div><ArrowRight size={16}/></a></div>
        <div className="section-title"><div><h2>전체 현황</h2><span>등록된 계측기와 검교정 상태를 한눈에 확인합니다.</span></div><a href="#instruments">현황 상세 보기 <ArrowRight size={14}/></a></div>
        <div className="stats-grid">
          <Stat href="/instruments" title="전체 계측기" value={data.total} unit="대" icon={<Gauge/>} tone="blue" note="등록 자산 기준"/>
          <Stat href="/calibrations" title="검교정 완료" value={certified} unit="대" icon={<CheckCircle2/>} tone="green" note="유효기간 내" trend="+4.8%"/>
          <Stat href="/instruments?status=dueSoon" title="검교정 임박" value={data.dueSoon} unit="대" icon={<Clock3/>} tone="amber" note="30일 이내 예정"/>
          <Stat href="/instruments?status=overdue" title="검교정 만료" value={data.overdue} unit="대" icon={<CircleAlert/>} tone="red" note="조치가 필요합니다"/>
          <Stat href="/approvals" title="결재 대기" value={0} unit="건" icon={<ClipboardCheck/>} tone="violet" note="처리할 결재 문서"/>
        </div>
        <div className="dashboard-grid">
          <section className="panel chart-panel"><div className="panel-head"><div><h3>검교정 계획 대비 실적</h3><p>월별 예정 건수와 완료 이력 비교</p></div><div className="chart-actions"><nav className="range-options" aria-label="표시 기간">{[3,6,9,12].map(count=><a key={count} href={`/?months=${count}`} aria-current={monthCount===count?"true":undefined} className={monthCount===count?"active":""}>{count}개월</a>)}</nav><a className="select-button" href="/calendar">일정 보기 <ArrowRight size={14}/></a></div></div><div className="chart-legend"><span><i className="legend-light"/> 계획</span><span><i className="legend-blue"/> 완료 실적</span></div><div className="chart"><div className="y-axis"><span>{monthlyMax}</span><span>{Math.ceil(monthlyMax*.75)}</span><span>{Math.ceil(monthlyMax*.5)}</span><span>{Math.ceil(monthlyMax*.25)}</span><span>0건</span></div><div className="plot">{data.monthlyPlanVsActual.map((item,index)=><div className="bar-group" key={`${item.label}-${index}`}><div className="bars"><i className="bar budget" title={`계획 ${item.planned}건`} style={{height:`${item.planned?Math.max(5,item.planned/monthlyMax*100):0}%`}}/><i className="bar actual" title={`실적 ${item.actual}건`} style={{height:`${item.actual?Math.max(5,item.actual/monthlyMax*100):0}%`}}/></div><span>{item.label}</span></div>)}</div></div><div className="chart-foot"><span>계획 <strong>{plannedTotal}건</strong> · 실적 <strong>{actualTotal}건</strong></span><span className="positive"><ArrowUpRight size={14}/> 계획 대비 {performance}%</span></div></section>
          <section className="panel status-panel"><div className="panel-head"><div><h3>검교정 상태</h3><p>전체 계측기 기준</p></div><a className="more-button" href="/instruments" aria-label="계측기 전체 목록 보기">···</a></div><a className="donut-link" href="/instruments" aria-label="계측기 전체 목록 보기"><div className="donut-wrap"><div className="donut" style={{background:`conic-gradient(#12a878 0 ${data.total ? data.normal/data.total*100 : 0}%, #f4a62a ${data.total ? data.normal/data.total*100 : 0}% ${data.total ? (data.normal+data.dueSoon)/data.total*100 : 0}%, #ef5f66 ${data.total ? (data.normal+data.dueSoon)/data.total*100 : 0}% 100%)`}}><div><strong>{data.total}</strong><small>전체 대수 · 목록 보기</small></div></div></div></a><div className="status-legend"><a href="/instruments?status=normal"><i className="dot green"/><span>정상</span><strong>{data.normal}</strong></a><a href="/instruments?status=dueSoon"><i className="dot amber"/><span>검교정 임박</span><strong>{data.dueSoon}</strong></a><a href="/instruments?status=overdue"><i className="dot red"/><span>만료</span><strong>{data.overdue}</strong></a></div></section>
          <section className="panel recent-panel" id="instruments"><div className="panel-head"><div><h3>최근 계측기 현황</h3><p>검교정 일정을 선택하면 새 창에서 상세 대장을 엽니다.</p></div><a href="/instruments" className="text-link">전체 현황 / 목록 관리 <ArrowRight size={14}/></a></div><div className="table-wrap"><table><thead><tr><th>계측기</th><th>관리번호</th><th>담당 부서</th><th>다음 검교정</th><th>상태</th></tr></thead><tbody>{data.instruments.slice(0,6).map(item => <tr key={item.id}><td><a href={`/instruments/${item.id}`} target="_blank" rel="opener" className="instrument-name instrument-link"><span className="instrument-icon"><Gauge size={15}/></span><span><strong>{item.name}</strong><small>{item.manufacturer} · {item.model}</small></span></a></td><td className="code">{item.assetCode}</td><td>{item.department}</td><td>{dateText(item.dueDate)}</td><td><Status dueDate={item.dueDate} storedStatus={item.status}/></td></tr>)}</tbody></table>{data.instruments.length === 0 && <div className="empty-state">등록된 계측기가 없습니다. 계측기 대장에서 직접 등록하거나 Excel로 일괄 등록하세요.</div>}</div></section>
          <section className="panel schedule-panel"><div className="panel-head"><div><h3>다가오는 일정</h3><p>계측기명을 클릭하면 상세 관리 대장이 새 창으로 열립니다.</p></div><a href="/calendar" className="text-link">일정 보기 <ArrowRight size={14}/></a></div><div className="schedule-list">{data.instruments.filter(item => item.dueDate >= new Date()).slice(0,4).map(item => <div className="schedule-row" key={item.id}><div className="schedule-date"><strong>{new Intl.DateTimeFormat("ko-KR", {day:"2-digit"}).format(item.dueDate)}</strong><small>{new Intl.DateTimeFormat("ko-KR", {month:"short"}).format(item.dueDate)}</small></div><a className="schedule-info schedule-detail-link" href={`/instruments/${item.id}`} target="_blank" rel="opener" aria-label={`${item.name} 상세 관리 대장을 새 창으로 열기`}><strong>{item.name}</strong><small>{item.assetCode} · {item.department}</small></a><Status dueDate={item.dueDate}/></div>)}{awaiting === 0 && <div className="empty-state">예정된 검교정 일정이 없습니다.</div>}</div><div className="schedule-note"><CircleAlert size={16}/><span><strong>{awaiting}건</strong>의 검교정 업무 확인이 필요합니다.</span></div></section>
        </div>
        <div className="bottom-row"><div><ShieldCheck size={16}/><span>로컬 데이터베이스 연결됨</span><i/></div><span>일부 메뉴는 다음 개발 단계에서 제공됩니다.</span><span className="version">CALIBRA · v0.1.1</span></div>
        <div className="developer-credit">Developed by Hanullim · Hyun Shik Kim | <a href="mailto:kenter6746060@gmail.com">kenter6746060@gmail.com</a></div>
      </div>
    </section>
  </main>;
}

function DashboardLoading() {
  return <main className="shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="CALIBRA 홈"><div className="brand-mark"><img src="/angbu-ilgu.svg" alt="앙부일구 해시계"/></div><div><strong>CALIBRA</strong><small>계측기 통합관리</small></div></a>
      <div className="workspace"><span className="workspace-dot"/> 개인 작업공간 <ChevronDown size={14}/></div><div className="nav-caption">WORKSPACE</div>
      <nav>{menu.slice(0,14).map(({label,icon:Icon,active,href})=><a key={label} href={href??"/"} className={`nav-item ${active?"active":""}`} data-label={label} title={label}><Icon size={17}/><span>{label}</span></a>)}<details className="nav-accordion"><summary className="nav-item"><Wrench size={17}/><span>외부 검교정 관리</span><ChevronDown size={13}/></summary><div className="nav-subitems"><a href="/calibrations?route=external">외부 검교정 의뢰 이력</a><a href="/providers">검교정 기관 목록</a></div></details><details className="nav-accordion"><summary className="nav-item"><Activity size={17}/><span>통계적 공정관리</span><ChevronDown size={13}/></summary><div className="nav-subitems"><a href="/quality#qc7">QC 7가지 도구 · 교육 자료</a><a href="/quality#capability">공정능력 Cp · Cpk · Pp · Ppk</a><a href="/grr">Gage R&amp;R · MSA</a></div></details>{menu.slice(14).map(({label,icon:Icon,href})=><a key={label} href={href??"/"} className="nav-item" data-label={label} title={label}><Icon size={17}/><span>{label}</span></a>)}</nav>
      <div className="sidebar-bottom"><div className="avatar">관</div><div><strong>관리자</strong><small>로컬 사용자</small></div><form action={signOut}><button className="logout-button">로그아웃</button></form></div>
    </aside>
    <section className="main-area"><header className="topbar"><div className="crumb"><a href="/">워크스페이스</a><span>/</span><strong>대시보드</strong></div><div className="top-actions"><form className="search dashboard-search" action="/instruments" method="get"><Search size={16}/><input name="q" aria-label="계측기 검색" placeholder="계측기, 관리번호 검색"/><button type="submit" aria-label="검색 실행">검색</button></form><a className="icon-button" href="/calendar" aria-label="검교정 일정 알림"><Bell size={18}/><i/></a><a className="user-pill" href="/settings" aria-label="시스템 설정"><div className="avatar small">관</div><span>관리자</span><ChevronDown size={14}/></a></div></header>
      <div className="content"><div className="welcome-row"><div><div className="eyebrow">CALIBRA WORKSPACE</div><h1>계측기 검교정 관리 시스템</h1><p className="quality-motto">품질은 수치로 말한다. 정확한 측정과 통계적 관리가 품질의 기본 요건입니다.</p><small className="dashboard-caption">홈 화면을 먼저 열었습니다. 계측기 및 검교정 자료를 불러오고 있습니다.</small></div><a href="/calendar" className="date-button"><CalendarDays size={16}/> 검교정 일정 달력 <ChevronDown size={14}/></a></div>
      <section className="home-sundial-feature" aria-label="품질 상태 게이지 소개"><div className="home-sundial-copy"><span className="eyebrow">MEASURE · ANALYZE · IMPROVE</span><h2>품질은 수치로 말합니다</h2><p>측정 데이터와 통계적 공정관리로 공정 상태를 살피고, 개선 방향을 찾습니다.</p><span className="dashboard-loading-status" role="status"><i/> 계측기 현황을 불러오는 중…</span></div><img src="/quality-state-gauge.png" alt="품질 상태 게이지"/></section>
      <div className="home-quick-links"><a className="home-training-shortcut" href="/training/materials"><span><FileText size={18}/></span><div><strong>통계적 공정관리 교육 교재</strong><small>이론 학습과 PDF·PPT 실습자료 목록을 엽니다.</small></div><ArrowRight size={16}/></a><a className="home-training-shortcut qualification-shortcut" href="/special-process"><span><ShieldCheck size={18}/></span><div><strong>특별특성 공정 자격인정 현황</strong><small>자격인정 기록을 확인합니다.</small></div><ArrowRight size={16}/></a></div>
      <div className="section-title"><div><h2>전체 현황</h2><span>계측기와 검교정 요약을 준비하고 있습니다.</span></div></div><div className="dashboard-loading-panel" role="status"><span className="loading-spinner"/><div><strong>업무 자료 불러오는 중</strong><small>로컬 데이터베이스에서 계측기·일정·자격인정 현황을 조회하고 있습니다.</small></div></div>
      </div></section>
  </main>;
}

function Stat({href,title, value, unit, icon, tone, note, trend}: {href:string;title:string; value:number; unit:string; icon:React.ReactNode; tone:string; note:string; trend?:string}) {
  return <a href={href} className="stat-card" aria-label={`${title} ${value}${unit} 상세 보기`}><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-meta"><span>{title}</span><div><strong>{value}</strong><small>{unit}</small></div></div><div className="stat-footer"><span>{note}</span>{trend && <em><ArrowUpRight size={12}/>{trend}</em>}</div></a>;
}

function Status({dueDate,storedStatus}: {dueDate:Date;storedStatus?:string}) {
  const days = Math.ceil((dueDate.getTime()-Date.now())/86_400_000);
  const status = storedStatus&&!["정상","임박","만료"].includes(storedStatus)?storedStatus:days < 0 ? "만료" : days <= 30 ? "임박" : "정상";
  return <span className={`status ${status === "정상" ? "ok" : status === "임박" ? "warning" : "expired"}`}><i/>{status}</span>;
}


