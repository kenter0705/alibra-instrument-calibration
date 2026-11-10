import { NextRequest,NextResponse } from "next/server";
import { mkdir,writeFile } from "node:fs/promises";
import { extname,join } from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getDataPath } from "@/lib/data-directory";
export const runtime="nodejs";
const allowed=new Set([".pdf",".doc",".docx",".jpg",".jpeg",".png"]);
export async function POST(request:NextRequest){const form=await request.formData();const file=form.get("file");const instrumentId=String(form.get("instrumentId")||"");if(!(file instanceof File)||!instrumentId)return NextResponse.json({error:"파일과 계측기 ID가 필요합니다."},{status:400});if(file.size>25*1024*1024)return NextResponse.json({error:"파일은 25MB 이하만 등록할 수 있습니다."},{status:413});const ext=extname(file.name).toLowerCase();if(!allowed.has(ext))return NextResponse.json({error:"PDF, DOC/DOCX, JPG, PNG 파일만 지원합니다."},{status:415});const instrument=await prisma.instrument.findUnique({where:{id:instrumentId},select:{id:true}});if(!instrument)return NextResponse.json({error:"계측기를 찾을 수 없습니다."},{status:404});const fileName=`${randomUUID()}${ext}`;const dir=getDataPath("manuals");await mkdir(dir,{recursive:true});await writeFile(join(dir,fileName),Buffer.from(await file.arrayBuffer()));const doc=await prisma.instrumentDocument.create({data:{instrumentId,title:String(form.get("title")||file.name),documentType:"사용 설명서",fileName:file.name,filePath:`data/manuals/${fileName}`,revision:"등록본",uploadedBy:"로컬 등록"}});return NextResponse.json({id:doc.id},{status:201})}


