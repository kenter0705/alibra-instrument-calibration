import { NextRequest,NextResponse } from "next/server";
import { mkdir,writeFile } from "node:fs/promises";
import { extname,join } from "node:path";
import { getDataPath } from "@/lib/data-directory";
import { randomUUID } from "node:crypto";
export const runtime="nodejs";
export async function POST(request:NextRequest){const file=(await request.formData()).get("file");if(!(file instanceof File)||!file.size||file.size>8*1024*1024)return NextResponse.json({error:"이미지는 8MB 이하로 선택해 주세요."},{status:400});const ext=extname(file.name).toLowerCase();if(![".jpg",".jpeg",".png",".webp"].includes(ext))return NextResponse.json({error:"JPG, PNG, WebP 이미지만 삽입할 수 있습니다."},{status:415});const name=`${randomUUID()}${ext}`;const dir=getDataPath("manual-images");await mkdir(dir,{recursive:true});await writeFile(join(dir,name),Buffer.from(await file.arrayBuffer()));return NextResponse.json({url:`/api/manual-images/${name}`},{status:201})}


