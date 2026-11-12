import Link from "next/link";
import { ArrowLeft, Gauge } from "lucide-react";
import { prisma } from "@/lib/prisma";
import GrrWorkspace from "@/components/grr-workspace";
import PrintButton from "@/components/print-button";
import GrrAnnualPlan from "@/components/grr-annual-plan";

export const dynamic="force-dynamic";
export default async function GrrPage(){
  const [records,instruments,plans]=await Promise.all([
    prisma.gageRRStudy.findMany({orderBy:{studyNumber:"asc"}}),
    prisma.instrument.findMany({where:{status:{not:"폐기"}},select:{id:true,assetCode:true,name:true,category:true,department:true,measurementUnit:true,resolution:true,accuracy:true},orderBy:{assetCode:"asc"}}),
    prisma.gageRRPlan.findMany({orderBy:{plannedDate:"asc"}}),
  ]);
  const studies=records.map(study=>({id:study.id,studyNumber:study.studyNumber,title:study.title,studyType:study.studyType,measurementUnit:study.measurementUnit,measurementError:study.measurementError,department:study.department,studyDate:study.studyDate.toISOString(),criteriaRRPercent:study.criteriaRRPercent,criteriaPTPercent:study.criteriaPTPercent,criteriaNdc:study.criteriaNdc,criteriaKappa:study.criteriaKappa,criteriaAgreementPercent:study.criteriaAgreementPercent,instrumentId:study.instrumentId,instrumentName:study.instrumentName,data:JSON.parse(study.data),lowerSpec:study.lowerSpec,upperSpec:study.upperSpec,updatedAt:study.updatedAt.toISOString()}));
  const planData=plans.map(p=>({...p,plannedDate:p.plannedDate.toISOString()}));const planStudies=records.map(s=>({id:s.id,studyNumber:s.studyNumber,title:s.title,studyType:s.studyType,instrumentName:s.instrumentName,department:s.department,studyDate:s.studyDate.toISOString()}));
  const variable=records.filter(x=>x.studyType==="계량치").length;const attribute=records.filter(x=>x.studyType==="계수치").length;
  return <main className="record-page"><header className="record-top"><Link href="/" className="back-link"><ArrowLeft size={16}/> 대시보드</Link><div className="record-actions"><PrintButton label="인쇄 미리보기 / 인쇄" icon/></div></header><section className="record-content grr-content"><div className="page-heading"><div><span className="eyebrow">MEASUREMENT SYSTEM ANALYSIS</span><h1>Gage R&amp;R · 측정시스템 분석</h1><p>계량치·계수치 측정시스템의 반복성, 재현성, 불확실도 및 관리도를 분석합니다.</p></div><div className="grr-heading-icon"><Gauge size={24}/></div></div><div className="grr-top-summary"><div><span className="summary-icon blue"><Gauge size={18}/></span><div><small>전체 분석</small><strong>{records.length}건</strong></div></div><div><span className="summary-icon green">X</span><div><small>계량치</small><strong>{variable}건</strong></div></div><div><span className="summary-icon violet">✓</span><div><small>계수치</small><strong>{attribute}건</strong></div></div><div className="grr-data-note"><strong>가상 예시 데이터 포함</strong><span>시연용 샘플이며 실제 판정 자료와 구분해 사용하세요.</span></div></div><GrrAnnualPlan initialPlans={planData} instruments={instruments} studies={planStudies}/><GrrWorkspace initialStudies={studies} instruments={instruments}/></section></main>;
}

