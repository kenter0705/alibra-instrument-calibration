import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { backup, DatabaseSync } from "node:sqlite";
import { educationUser } from "@/lib/education-auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 const actor=await educationUser().catch(()=>null);
 if(!actor)return Response.json({error:"로그인이 필요합니다."},{status:401});
 if(actor.role!=="관리자")return Response.json({error:"가입정보가 포함된 전체 DB 백업은 관리자만 사용할 수 있습니다."},{status:403});
 const url=process.env.DATABASE_URL||"file:./dev.db";if(!url.startsWith("file:"))return Response.json({error:"SQLite 파일 데이터베이스가 아닙니다."},{status:400});
 const raw=url.slice(5).split("?")[0];const dbPath=url.startsWith("file:///")?fileURLToPath(url):path.isAbsolute(raw)?raw:path.resolve(process.cwd(),"prisma",decodeURIComponent(raw));
 const temporary=await mkdtemp(path.join(tmpdir(),"calibra-backup-"));
 let source:DatabaseSync|undefined;
 try{
  source=new DatabaseSync(dbPath,{readOnly:true,timeout:5000});
  const destination=path.join(temporary,"snapshot.db");
  await backup(source,destination);
  const bytes=await readFile(destination);
  return new Response(Uint8Array.from(bytes),{headers:{"Content-Type":"application/vnd.sqlite3","Content-Disposition":"attachment; filename=calibra-backup.db","Cache-Control":"private, no-store"}});
 }catch{return Response.json({error:"데이터베이스 백업에 실패했습니다."},{status:500})}
 finally{source?.close();if(temporary.startsWith(path.resolve(tmpdir())+path.sep+"calibra-backup-"))await rm(temporary,{recursive:true,force:true}).catch(()=>{});}
}
