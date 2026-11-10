import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { extname,join } from "node:path";
import { prisma } from "@/lib/prisma";
import { getDataPath } from "@/lib/data-directory";
export const runtime="nodejs";
const types:Record<string,string>={".pdf":"application/pdf",".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",".webp":"image/webp",".doc":"application/msword",".docx":"application/vnd.openxmlformats-officedocument.wordprocessingml.document",".xlsx":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"};
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const item=await prisma.calibrationAttachment.findUnique({where:{id}});if(!item)return NextResponse.json({error:"첨부 파일을 찾을 수 없습니다."},{status:404});const safe=item.filePath.replace(/^data[\\/]certificates[\\/]/,"");const bytes=await readFile(getDataPath("certificates",safe));return new Response(bytes,{headers:{"Content-Type":types[extname(safe).toLowerCase()]??item.mediaType,"Content-Disposition":`inline; filename*=UTF-8''${encodeURIComponent(item.fileName)}`}})}


