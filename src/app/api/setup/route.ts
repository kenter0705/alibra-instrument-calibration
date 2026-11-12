import { mkdir, open, unlink, readFile } from "node:fs/promises";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { IS_CLASSROOM, SESSION_COOKIE } from "@/lib/app-edition";
import { loopbackRequest, sameOriginRequest, requestLink } from "@/lib/request-origin";
import { getDataPath } from "@/lib/data-directory";
import { prisma } from "@/lib/prisma";
import { hashPassword, makeSession, SESSION_DURATION_SECONDS } from "@/lib/auth";
export const runtime="nodejs";
export async function POST(request: Request) {
  if (!loopbackRequest(request) || !sameOriginRequest(request)) return Response.json({error:"서버 PC의 로컬 주소에서만 최초 등록할 수 있습니다."},{status:403});
  if (await prisma.userAccount.count() > 0) return Response.json({error:"관리자 등록이 이미 완료됐습니다."},{status:409});
  const form=await request.formData();const supplied=Buffer.from(String(form.get("setupToken")||""));const token=await readFile(getDataPath("setup","first-admin-token.txt"),"utf8").then(value=>value.trim()).catch(()=>"");const expected=Buffer.from(token);
  if(!token || supplied.length!==expected.length || !timingSafeEqual(supplied,expected))return Response.json({error:"설치 PC의 바탕화면 바로가기에서 최초 등록을 시작하세요."},{status:403});
  const root=getDataPath("setup");await mkdir(root,{recursive:true});const lock=getDataPath("setup","first-admin.lock");
  let handle;try{handle=await open(lock,"wx");}catch{return Response.json({error:"최초 등록을 처리 중입니다. 잠시 후 다시 확인하세요."},{status:409});}
  try {
    const email=String(form.get("email")||"").trim().toLowerCase(),displayName=String(form.get("displayName")||"").trim(),password=String(form.get("password")||"");
    if(!displayName || displayName.length>80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>200 || password.length<8 || password.length>200 || password!==form.get("confirmation"))throw new Error("이름·이메일과 8~200자의 동일한 비밀번호를 확인하세요.");
    if(!process.env.AUTH_SECRET)throw new Error("앱 실행기를 통해 서버를 다시 실행하세요.");
    if(await prisma.userAccount.count()>0)return Response.json({error:"관리자 등록이 이미 완료됐습니다."},{status:409});
    const user=await prisma.userAccount.create({data:{username:email,email,displayName,passwordHash:hashPassword(password),role:"관리자",active:true,profileComplete:true}});
    const response=NextResponse.redirect(requestLink(request,"/"),303);response.cookies.set(SESSION_COOKIE,makeSession(user.id),{httpOnly:true,secure:process.env.APP_HTTPS==="true",sameSite:"lax",path:"/",maxAge:SESSION_DURATION_SECONDS});return response;
  }catch(error){const url=requestLink(request,"/setup");url.searchParams.set("token",token);url.searchParams.set("error",error instanceof Error?error.message:"등록 실패");return NextResponse.redirect(url,303);}finally{await handle.close();await unlink(lock).catch(()=>{});}
}
