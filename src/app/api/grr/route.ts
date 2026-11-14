import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime="nodejs";
export async function POST(request:NextRequest){
  const body=await request.json() as {id?:string;title?:string;studyType?:string;instrumentId?:string;instrumentName?:string;measurementUnit?:string;measurementError?:number|null;department?:string;studyDate?:string;criteriaRRPercent?:number;criteriaPTPercent?:number;criteriaNdc?:number;criteriaKappa?:number;criteriaAgreementPercent?:number;data?:unknown;lowerSpec?:number|null;upperSpec?:number|null};
  if(!body.title?.trim()||!body.studyType||!body.data)return NextResponse.json({error:"시험명, 시험 유형, 측정 데이터가 필요합니다."},{status:400});
  const instrument=body.instrumentId?await prisma.instrument.findUnique({where:{id:body.instrumentId},select:{id:true,assetCode:true,name:true,measurementUnit:true,department:true}}):null;
  if(body.instrumentId&&!instrument)return NextResponse.json({error:"선택한 계측기를 찾을 수 없습니다."},{status:404});
  const year=new Date().getFullYear();const studyNumber=`GRR-${year}-${Date.now().toString().slice(-6)}`;
  const result=await prisma.gageRRStudy.create({data:{studyNumber,title:body.title.trim(),studyType:body.studyType,instrumentId:instrument?.id,instrumentName:instrument?`${instrument.assetCode} · ${instrument.name}`:body.instrumentName||"미지정",measurementUnit:body.measurementUnit||instrument?.measurementUnit||"mm",measurementError:body.measurementError??null,department:body.department||instrument?.department||"",studyDate:body.studyDate?new Date(body.studyDate):new Date(),criteriaRRPercent:body.criteriaRRPercent??10,criteriaPTPercent:body.criteriaPTPercent??10,criteriaNdc:body.criteriaNdc??5,criteriaKappa:body.criteriaKappa??0.75,criteriaAgreementPercent:body.criteriaAgreementPercent??90,data:JSON.stringify(body.data),lowerSpec:body.lowerSpec??null,upperSpec:body.upperSpec??null}});
  return NextResponse.json({id:result.id,studyNumber:result.studyNumber},{status:201});
}
export async function PUT(request:NextRequest){
  const body=await request.json() as {id?:string;title?:string;studyType?:string;instrumentId?:string;instrumentName?:string;measurementUnit?:string;measurementError?:number|null;department?:string;studyDate?:string;criteriaRRPercent?:number;criteriaPTPercent?:number;criteriaNdc?:number;criteriaKappa?:number;criteriaAgreementPercent?:number;data?:unknown;lowerSpec?:number|null;upperSpec?:number|null};
  if(!body.id||!body.title?.trim()||!body.studyType||!body.data)return NextResponse.json({error:"수정할 시험과 필수 데이터가 필요합니다."},{status:400});
  const instrument=body.instrumentId?await prisma.instrument.findUnique({where:{id:body.instrumentId},select:{id:true,assetCode:true,name:true,measurementUnit:true,department:true}}):null;
  await prisma.gageRRStudy.update({where:{id:body.id},data:{title:body.title.trim(),studyType:body.studyType,instrumentId:instrument?.id??null,instrumentName:instrument?`${instrument.assetCode} · ${instrument.name}`:body.instrumentName||"미지정",measurementUnit:body.measurementUnit||instrument?.measurementUnit||"mm",measurementError:body.measurementError??null,department:body.department||instrument?.department||"",studyDate:body.studyDate?new Date(body.studyDate):undefined,criteriaRRPercent:body.criteriaRRPercent??10,criteriaPTPercent:body.criteriaPTPercent??10,criteriaNdc:body.criteriaNdc??5,criteriaKappa:body.criteriaKappa??0.75,criteriaAgreementPercent:body.criteriaAgreementPercent??90,data:JSON.stringify(body.data),lowerSpec:body.lowerSpec??null,upperSpec:body.upperSpec??null}});
  return NextResponse.json({ok:true});
}
export async function DELETE(request:NextRequest){const {id}=await request.json() as {id?:string};if(!id)return NextResponse.json({error:"삭제할 시험을 선택해 주세요."},{status:400});await prisma.gageRRStudy.delete({where:{id}});return NextResponse.json({ok:true});}
