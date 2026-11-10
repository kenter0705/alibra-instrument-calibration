import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { basename,extname,join } from "node:path";
import { getDataPath } from "@/lib/data-directory";
export const runtime="nodejs";
const types:Record<string,string>={".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",".webp":"image/webp"};
export async function GET(_request:Request,{params}:{params:Promise<{name:string}>}){const {name}=await params;if(basename(name)!==name||!types[extname(name).toLowerCase()])return NextResponse.json({error:"이미지 경로가 올바르지 않습니다."},{status:400});try{const file=await readFile(getDataPath("manual-images",name));return new Response(file,{headers:{"Content-Type":types[extname(name).toLowerCase()],"Cache-Control":"private, max-age=31536000"}})}catch{return NextResponse.json({error:"이미지를 찾을 수 없습니다."},{status:404})}}

