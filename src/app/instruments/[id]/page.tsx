import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ClipboardList, Gauge } from "lucide-react";
import QRCode from "qrcode";
import { headers } from "next/headers";
import { networkInterfaces } from "node:os";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/print-button";
import Barcode from "@/components/barcode";
import InstrumentPhotoManager from "@/components/instrument-photo-manager";
import CalibrationRecordForm from "@/components/calibration-record-form";
import BoardPopupActions from "@/components/board-popup-actions";

export const dynamic = "force-dynamic";

export default async function InstrumentLedger({ params }: { params: Promise<{id:string}> }) {
  const {id} = await params;
  const [instrument,providers,procedures] = await Promise.all([prisma.instrument.findUnique({where:{id},include:{preferredCalibrationProvider:true,calibrations:{include:{provider:true,procedure:true,attachments:true},orderBy:{performedAt:"desc"}}}}),prisma.calibrationProvider.findMany({select:{id:true,name:true},orderBy:{name:"asc"}}),prisma.calibrationProcedure.findMany({select:{id:true,title:true},orderBy:{title:"asc"}})]);
  if (!instrument) notFound();
  const requestHeaders=await headers();
  const incomingHost=requestHeaders.get("x-forwarded-host")??requestHeaders.get("host")??"localhost:3000";
  const protocol=requestHeaders.get("x-forwarded-proto")??"http";
  const hostName=incomingHost.replace(/^\[|\]$/g,"").split(":")[0].toLowerCase();
  const lanAddress=Object.entries(networkInterfaces()).flatMap(([name,addresses])=>(addresses??[]).filter(x=>x.family==="IPv4"&&!x.internal&&/^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(x.address)).map(x=>({name,address:x.address}))).sort((a,b)=>Number(!/wi-?fi|wireless/i.test(a.name))-Number(!/wi-?fi|wireless/i.test(b.name)))[0]?.address;
  const requestPort=incomingHost.match(/:(\d+)$/)?.[1];
  const publicBase=(process.env.CALIBRA_PUBLIC_BASE_URL??(hostName==="localhost"||hostName==="127.0.0.1"?`http://${lanAddress??"localhost"}:${requestPort??process.env.PORT??"3000"}`:`${protocol}://${incomingHost}`)).replace(/\/$/,"");
  const scanUrl=`${publicBase}/scan/${encodeURIComponent(instrument.assetCode)}`;
  const qr = await QRCode.toDataURL(scanUrl, {width:220, margin:1, errorCorrectionLevel:"M"});
  const days = Math.ceil((instrument.dueDate.getTime()-Date.now())/86_400_000);
  const status = days < 0 ? "만료" : days <= 30 ? "임박" : "정상";
  const fullDate = (d:Date) => new Intl.DateTimeFormat("ko-KR", {year:"numeric",month:"long",day:"numeric"}).format(d);
  return <main className="record-page ledger-page">
    <header className="record-top"><BoardPopupActions listHref="/instruments" listLabel="계측기 목록"/><div className="record-actions"><Link className="secondary-button" target="_blank" rel="opener" href={`/instruments/${id}/manual`}><BookOpen size={15}/> 사용 설명서</Link><Link className="secondary-button" target="_blank" rel="opener" href={`/instruments/${id}/management`}><ClipboardList size={15}/> 관리 방법</Link><PrintButton label="인쇄 미리보기 / 인쇄" icon/></div></header>
    <article className="ledger-sheet">
      <div className="ledger-heading"><div><span className="eyebrow">CALIBRATION ASSET RECORD</span><h1>상세 계측기 관리 대장</h1><p>계측기 식별, 보유, 교정 관리 기록</p></div><span className={`status ${status === "정상" ? "ok" : status === "임박" ? "warning" : "expired"}`}><i/>{status}</span></div>
      <div className="ledger-id-row"><span>관리번호 <strong>{instrument.assetCode}</strong></span><span>등록일 <strong>{fullDate(instrument.createdAt)}</strong></span><span>문서 상태 <strong>{instrument.status}</strong></span></div>
      <section className="instrument-scan-summary"><div><small>관리번호</small><strong>{instrument.assetCode}</strong></div><div><small>품명</small><strong>{instrument.name}</strong></div><div><small>구매처</small><strong>{instrument.purchaseSource||"미등록"}</strong></div><div><small>구매년도</small><strong>{instrument.purchaseDate?.getFullYear()??"미등록"}</strong></div><div><small>최근 검교정일</small><strong>{instrument.lastCalibrated?fullDate(instrument.lastCalibrated):"이력 없음"}</strong></div><div><small>차기 검교정일</small><strong>{fullDate(instrument.dueDate)}</strong></div></section>
      <InstrumentPhotoManager instrumentId={instrument.id} name={instrument.name} category={instrument.category} photos={[instrument.photoPath,instrument.photoPath2,instrument.photoPath3]} representativePhoto={instrument.representativePhoto}/>
      <div className="ledger-main-grid"><div className="ledger-fields">
        <LedgerSection title="계측기 기본 정보" rows={[["계측기명",instrument.name],["계측기 분류",instrument.category],["제조사 / 모델",`${instrument.manufacturer} / ${instrument.model}`],["제조번호",instrument.serialNumber],["구매처 / 구매일",`${instrument.purchaseSource||"미등록"} / ${instrument.purchaseDate?fullDate(instrument.purchaseDate):"미등록"}`],["구매 금액",instrument.purchaseCost?`${instrument.purchaseCost.toLocaleString("ko-KR")}원`:"미등록"],["사용 목적",instrument.usagePurpose||"미등록"],["측정 범위",`${instrument.measurementRange||"미등록"} ${instrument.measurementUnit}`],["측정 단위",instrument.measurementUnit],["분해능 / 정확도",`${instrument.resolution||"미등록"} / ${instrument.accuracy||"미등록"}`],["사양",instrument.specification||"미등록"],["관리 부서 / 담당자",`${instrument.department} / ${instrument.owner}`],["사용·보관 위치",instrument.location],["보관 조건",instrument.storageCondition||"미등록"]]}/>
        <LedgerSection title="검교정 관리 정보" rows={[["지정 검교정 기관",instrument.preferredCalibrationProvider?.name??"미지정"],["최근 검교정 기관",instrument.calibrations[0]?.provider?.name??(instrument.calibrations[0]?"자체 검교정":"이력 없음")],["최근 검교정일",fullDate(instrument.lastCalibrated)],["다음 검교정 예정일",fullDate(instrument.dueDate)],["검교정 주기",`${instrument.calibrationIntervalMonths}개월`],["교정 상태",status],["자산 등록 / 수정",`${fullDate(instrument.createdAt)} / ${fullDate(instrument.updatedAt)}`]]}/>
        <section className="ledger-section"><div className="ledger-section-head"><h2>연도별 검교정 이력 및 성적서</h2><Link className="table-action no-print" href={`/calibrations?instrument=${instrument.id}`}>전체 이력 화면</Link></div><div className="ledger-table-wrap"><table><thead><tr><th>연도</th><th>검교정일</th><th>결과</th><th>검교정 기관</th><th>성적서 번호</th><th>첨부 파일</th></tr></thead><tbody>{instrument.calibrations.map(record=><tr key={record.id}><td>{record.performedAt.getFullYear()}</td><td>{fullDate(record.performedAt)}</td><td>{record.result}</td><td>{record.provider?.name??record.procedure?.calibrationRoute??"자체 검교정"}</td><td>{record.certificateNumber}</td><td>{record.attachments.length?record.attachments.map(file=><a className="file-chip" key={file.id} href={`/api/calibration-files/${file.id}`} target="_blank">{file.fileName}</a>):"미첨부"}</td></tr>)}{!instrument.calibrations.length&&<tr><td colSpan={6}>등록된 이력이 없습니다. 아래 등록 양식에서 연도별로 추가해 주세요.</td></tr>}</tbody></table></div><p className="muted-note">성적서 PDF, 스캔 이미지, 원자료를 연도별 기록에 여러 개 첨부할 수 있습니다.</p><div className="ledger-history-form"><div className="ledger-section-head"><h3>검교정 이력 등록</h3><span className="muted-note">기관, 결과, 성적서, 비용과 파일 첨부를 저장합니다.</span></div><CalibrationRecordForm instruments={[{id:instrument.id,name:instrument.name,assetCode:instrument.assetCode,category:instrument.category,calibrationIntervalMonths:instrument.calibrationIntervalMonths}]} providers={providers} procedures={procedures.map(p=>({id:p.id,name:p.title}))} preselected={instrument.id}/></div></section>
      </div><aside className="ledger-codes"><div className="code-card"><h2>바코드</h2><Barcode value={scanUrl}/><strong>{instrument.barcodeNumber ?? instrument.assetCode}</strong><small>자동 발급 관리번호 · 스마트폰/바코드 리더로 스캔해 상세 대장 열기</small></div><div className="code-card qr-card"><h2>QR 코드</h2><img src={qr} alt="휴대폰 스캔용 계측기 상세 대장 QR 코드"/><strong>{instrument.assetCode}</strong><small>스캔하면 관리번호·품명·구매처·구매년도·검교정일이 표시됩니다.</small></div><div className="ledger-standard"><strong>휴대폰 접속 안내</strong><p>PC와 휴대폰을 같은 Wi-Fi에 연결하고 서버를 실행하세요.</p><p>연결 주소: {publicBase}</p></div><div className="ledger-standard"><strong>관리 기준 참고</strong><p>ISO 10012:2026 측정관리 체계</p><p>ISO/IEC 17025:2017 교정 역량 참고</p></div></aside></div>
      <footer className="ledger-footer"><span>CALIBRA · 계측기 검교정 이력관리</span><span>출력일 {fullDate(new Date())}</span></footer>
    </article>
  </main>;
}

function LedgerSection({title,rows}:{title:string;rows:string[][]}) {
  return <section className="ledger-section"><h2>{title}</h2><dl>{rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>;
}
