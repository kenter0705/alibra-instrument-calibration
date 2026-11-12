import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import CalibrationRecordForm from "@/components/calibration-record-form";
import BoardPopupActions from "@/components/board-popup-actions";
import PrintButton from "@/components/print-button";
export const dynamic="force-dynamic";
export default async function CalibrationDetailPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{saved?:string}>}){
 const {id}=await params;const {saved}=await searchParams;const r=await prisma.calibrationRecord.findUnique({where:{id},include:{instrument:true,provider:true,procedure:true,attachments:true}});if(!r)notFound();
 const record={id:r.id,instrumentId:r.instrumentId,performedAt:r.performedAt.toISOString(),nextDueDate:r.nextDueDate.toISOString(),result:r.result,providerId:r.providerId,procedureId:r.procedureId,certificateNumber:r.certificateNumber,cost:r.cost,notes:r.notes,attachments:r.attachments.map(a=>({id:a.id,fileName:a.fileName}))};
 const [instruments,providers,procedures]=await Promise.all([prisma.instrument.findMany({where:{status:{notIn:["폐기","분실"]}},select:{id:true,name:true,assetCode:true,category:true,calibrationIntervalMonths:true},orderBy:{assetCode:"asc"}}),prisma.calibrationProvider.findMany({select:{id:true,name:true},orderBy:{name:"asc"}}),prisma.calibrationProcedure.findMany({select:{id:true,title:true},orderBy:{title:"asc"}})]);
 return <main className="record-page"><header className="record-top"><BoardPopupActions listHref={`/calibrations?year=${r.performedAt.getFullYear()}`} listLabel="목록가기"/><PrintButton label="인쇄" icon/></header><section className="record-content"><div className="page-heading"><div><span className="eyebrow">CALIBRATION RECORD · {r.certificateNumber}</span><h1>{r.instrument.assetCode} · {r.instrument.name}</h1><p>{r.performedAt.toLocaleDateString("ko-KR")} 검교정 상세 기록</p></div></div>{saved&&<div className="form-success" role="status">검교정 이력이 데이터베이스에 등록되었습니다.</div>}<section className="panel calibration-editor-panel"><CalibrationRecordForm instruments={instruments} providers={providers} procedures={procedures.map(p=>({id:p.id,name:p.title}))} record={record} readOnly/></section></section></main>
}


