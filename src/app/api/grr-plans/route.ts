import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime="nodejs";
type Body={id?:string;plannedDate?:string;department?:string;instrumentId?:string;studyType?:string;title?:string;status?:string;actualStudyId?:string;note?:string};
async function makeData(body:Body){
  if(!body.plannedDate||!body.title?.trim()||!body.department?.trim())throw new Error("예정일, 부서명, 계획명을 입력해 주세요.");
  const plannedDate=new Date(body.plannedDate);if(Number.isNaN(+plannedDate))throw new Error("예정일이 올바르지 않습니다.");
  const instrument=body.instrumentId?await prisma.instrument.findUnique({where:{id:body.instrumentId},select:{id:true,assetCode:true,name:true}}):null;
  if(body.instrumentId&&!instrument)throw new Error("선택한 계측기를 찾을 수 없습니다.");
  if(body.actualStudyId){const study=await prisma.gageRRStudy.findUnique({where:{id:body.actualStudyId},select:{id:true,department:true,studyType:true}});if(!study)throw new Error("실적 분석 건을 찾을 수 없습니다.");}
  const status=body.status|| (body.actualStudyId?"완료":"계획");if(!["계획","완료","이월","취소"].includes(status))throw new Error("허용되지 않은 계획 상태입니다.");
  return {year:plannedDate.getFullYear(),plannedDate,department:body.department.trim(),instrumentId:instrument?.id??null,instrumentName:instrument?`${instrument.assetCode} · ${instrument.name}`:"미지정",studyType:body.studyType||"계량치",title:body.title.trim(),status:body.actualStudyId?"완료":status,actualStudyId:body.actualStudyId||null,note:body.note||""};
}
export async function POST(request:NextRequest){try{const body=await request.json() as Body;const data=await makeData(body);const result=await prisma.gageRRPlan.create({data});return NextResponse.json({id:result.id},{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"계획 저장 실패"},{status:400})}}
export async function PUT(request:NextRequest){try{const body=await request.json() as Body;if(!body.id)return NextResponse.json({error:"수정할 계획을 선택해 주세요."},{status:400});const data=await makeData(body);await prisma.gageRRPlan.update({where:{id:body.id},data});return NextResponse.json({ok:true})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"계획 수정 실패"},{status:400})}}
export async function DELETE(request:NextRequest){const {id}=await request.json() as {id?:string};if(!id)return NextResponse.json({error:"삭제할 계획을 선택해 주세요."},{status:400});await prisma.gageRRPlan.delete({where:{id}});return NextResponse.json({ok:true})}
