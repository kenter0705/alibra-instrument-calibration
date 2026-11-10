import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { extname,join } from "node:path";
import { prisma } from "@/lib/prisma";
import { getDataPath } from "@/lib/data-directory";
export const runtime="nodejs";
const types:Record<string,string>={".pdf":"application/pdf",".doc":"application/msword",".docx":"application/vnd.openxmlformats-officedocument.wordprocessingml.document",".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png"};
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const doc=await prisma.instrumentDocument.findUnique({where:{id}});if(!doc)return NextResponse.json({error:"문서를 찾을 수 없습니다."},{status:404});if(/^https?:\/\//i.test(doc.filePath))return NextResponse.redirect(doc.filePath);const safe=doc.filePath.replace(/^data[\\/]manuals[\\/]/,"");const bytes=await readFile(getDataPath("manuals",safe));return new Response(bytes,{headers:{"Content-Type":types[extname(safe).toLowerCase()]??"application/octet-stream","Content-Disposition":`inline; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`}})}


