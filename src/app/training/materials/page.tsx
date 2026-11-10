import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import TrainingMaterialsBoard from "@/components/training-materials-board";

export const dynamic = "force-dynamic";
const PAGE_SIZE=10;
export default async function TrainingMaterialsPage({searchParams}:{searchParams:Promise<{page?:string;q?:string;type?:string;date?:string}>}){
  const query=await searchParams,q=(query.q||"").trim(),type=query.type||"",date=query.date||"";
  const and:object[]=[];if(q)and.push({OR:[{materialNo:{contains:q}},{title:{contains:q}},{description:{contains:q}},{educationPurpose:{contains:q}},{learningContent:{contains:q}},{contentSummary:{contains:q}}]});if(type)and.push({fileType:type});if(date){const start=new Date(`${date}T00:00:00`),end=new Date(`${date}T23:59:59.999`);if(!Number.isNaN(start.getTime()))and.push({uploadedAt:{gte:start,lte:end}})}
  const where=and.length?{AND:and}:{};const total=await prisma.trainingMaterial.count({where}),pageCount=Math.max(1,Math.ceil(total/PAGE_SIZE)),page=Math.max(1,Math.min(pageCount,Number(query.page)||1));
  const materials=await prisma.trainingMaterial.findMany({where,orderBy:{uploadedAt:"desc"},skip:(page-1)*PAGE_SIZE,take:PAGE_SIZE});
  return <main className="record-page"><header className="record-top"><Link href="/" className="back-link"><ArrowLeft size={16}/> 홈 대시보드</Link><Link href="/training" className="secondary-button">측정자 교육 관리</Link></header><section className="record-content"><div className="page-heading"><div><span className="eyebrow">SPC TRAINING LIBRARY · MATERIAL LIST</span><h1>교육 교재 목록 게시판</h1><p>검색·분류·등록일로 자료를 찾고 제목을 누르면 상세 설명이 새 창에 열립니다.</p></div></div><TrainingMaterialsBoard materials={materials.map(x=>({...x,uploadedAt:x.uploadedAt.toISOString(),updatedAt:x.updatedAt.toISOString()}))} page={page} pageCount={pageCount} total={total} q={q} type={type} date={date} view="list"/></section></main>;
}
