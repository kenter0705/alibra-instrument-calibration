import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "@/lib/prisma";
export const runtime="nodejs";
export async function GET(){
 const url=process.env.DATABASE_URL||"file:./dev.db";if(!url.startsWith("file:"))return Response.json({error:"SQLite 파일 데이터베이스가 아닙니다."},{status:400});
 const raw=url.slice(5).split("?")[0];const dbPath=url.startsWith("file:///")?fileURLToPath(url):path.isAbsolute(raw)?raw:path.resolve(process.cwd(),"prisma",decodeURIComponent(raw));
 try{await prisma.$queryRawUnsafe("PRAGMA wal_checkpoint(FULL)");const bytes=await readFile(dbPath);return new Response(bytes,{headers:{"Content-Type":"application/vnd.sqlite3","Content-Disposition":"attachment; filename=calibra-backup.db","Cache-Control":"no-store"}})}catch{return Response.json({error:"데이터베이스 백업에 실패했습니다."},{status:500})}
}
