import { NextRequest,NextResponse } from "next/server";
import { mkdir,writeFile } from "node:fs/promises";
import { extname,join } from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getDataPath } from "@/lib/data-directory";
import { addCalibrationMonths, parseCalibrationDate } from "@/lib/calibration-dates";
export const runtime="nodejs";
const allowed=new Set([".pdf",".jpg",".jpeg",".png",".webp",".doc",".docx",".xlsx"]);
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const existing=await prisma.calibrationRecord.findUnique({where:{id}});if(!existing)return NextResponse.json({error:"검교정 이력을 찾을 수 없습니다."},{status:404});
 const form=await request.formData();const instrumentId=String(form.get("instrumentId")||"");const performedAtValue=String(form.get("performedAt")||"");const performedAt=parseCalibrationDate(performedAtValue);const result=String(form.get("result")||"");
 if(!instrumentId||!performedAt||!result)return NextResponse.json({error:"계측기, 유효한 검교정일, 결과를 입력해 주세요."},{status:400});
 const instrument=await prisma.instrument.findUnique({where:{id:instrumentId}});if(!instrument)return NextResponse.json({error:"계측기를 찾을 수 없습니다."},{status:404});
 const nextDueDate=addCalibrationMonths(performedAtValue,instrument.calibrationIntervalMonths);if(!nextDueDate)return NextResponse.json({error:"선택한 계측기의 검교정 주기가 설정되지 않았습니다. 계측기 대장에서 주기를 확인해 주세요."},{status:400});
 const certificateNumber=String(form.get("certificateNumber")||existing.certificateNumber);const costValue=String(form.get("cost")||"");const cost=costValue?Number(costValue):null;if(cost!==null&&(!Number.isFinite(cost)||cost<0))return NextResponse.json({error:"검교정 비용은 0 이상의 숫자로 입력해 주세요."},{status:400});
 const updated=await prisma.calibrationRecord.update({where:{id},data:{instrumentId,performedAt,nextDueDate,result,certificateNumber,providerId:form.get("providerId")?String(form.get("providerId")):null,procedureId:form.get("procedureId")?String(form.get("procedureId")):null,cost,notes:String(form.get("notes")||"")}});
 const files=form.getAll("attachments").filter((x):x is File=>x instanceof File&&x.size>0);const dir=getDataPath("certificates");if(files.length)await mkdir(dir,{recursive:true});for(const file of files){if(file.size>25*1024*1024)continue;const ext=extname(file.name).toLowerCase();if(!allowed.has(ext))continue;const saved=`${randomUUID()}${ext}`;await writeFile(join(dir,saved),Buffer.from(await file.arrayBuffer()));await prisma.calibrationAttachment.create({data:{recordId:id,fileName:file.name,filePath:`data/certificates/${saved}`,mediaType:file.type||"application/octet-stream"}})}
 await prisma.instrument.update({where:{id:instrumentId},data:{lastCalibrated:performedAt,dueDate:nextDueDate,status:result.includes("합격")?"정상":"보류"}});
 if(existing.instrumentId!==instrumentId){const latest=await prisma.calibrationRecord.findFirst({where:{instrumentId:existing.instrumentId},orderBy:{performedAt:"desc"}});if(latest)await prisma.instrument.update({where:{id:existing.instrumentId},data:{lastCalibrated:latest.performedAt,dueDate:latest.nextDueDate,status:latest.result.includes("합격")?"정상":"보류"}})}
 return NextResponse.json({id:updated.id,certificateNumber:updated.certificateNumber});
}
