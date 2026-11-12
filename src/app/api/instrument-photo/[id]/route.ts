import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { extname,join } from "node:path";
import { prisma } from "@/lib/prisma";
import { getDataPath } from "@/lib/data-directory";
export const runtime="nodejs";
const types:Record<string,string>={".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",".webp":"image/webp"};
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const query=new URL(request.url).searchParams;const item=await prisma.instrument.findUnique({where:{id},select:{photoPath:true,photoPath2:true,photoPath3:true,representativePhoto:true}});const slot=query.get("slot")==="rep"?item?.representativePhoto:Number(query.get("slot")||1);const key=slot===2?"photoPath2":slot===3?"photoPath3":"photoPath";const path=item?.[key];if(!path)return NextResponse.json({error:"사진이 없습니다."},{status:404});const safe=path.replace(/^data[\\/]photos[\\/]/,"");const bytes=await readFile(getDataPath("photos",safe));return new Response(bytes,{headers:{"Content-Type":types[extname(safe).toLowerCase()]??"application/octet-stream","Cache-Control":"private, max-age=3600"}})}


