import { randomBytes, timingSafeEqual } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APPROVAL_TICKET_SECONDS, hashPassword, makeApprovalTicket, makeSession, SESSION_DURATION_SECONDS } from "@/lib/auth";

export const runtime = "nodejs";
const sessionCookie = "calibra_session";
const secure = process.env.APP_HTTPS === "true";
function go(request: NextRequest, path: string) { return NextResponse.redirect(new URL(path, request.url)); }
function equal(a: string, b: string) { const x=Buffer.from(a), y=Buffer.from(b); return x.length===y.length && timingSafeEqual(x,y); }
function pending(request: NextRequest, userId: string) { const response=go(request,"/login?pending=1"); response.cookies.set("calibra_approval_ticket",makeApprovalTicket(userId),{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:APPROVAL_TICKET_SECONDS}); return response; }

export async function GET(request: NextRequest) {
  const params=request.nextUrl.searchParams;
  const code=params.get("code"), state=params.get("state");
  const jar=await cookies();
  const expectedState=jar.get("calibra_google_state")?.value||"";
  const expectedNonce=jar.get("calibra_google_nonce")?.value||"";
  jar.delete("calibra_google_state"); jar.delete("calibra_google_nonce");
  if(params.has("error")) return go(request,"/login?error=Google%20로그인이%20취소되었습니다");
  if(!code||!state||!expectedState||!expectedNonce||!equal(state,expectedState)) return go(request,"/login?error=Google%20로그인%20요청%20검증에%20실패했습니다");
  const clientId=process.env.GOOGLE_CLIENT_ID, clientSecret=process.env.GOOGLE_CLIENT_SECRET;
  if(!clientId||!clientSecret) return go(request,"/login?error=Google%20OAuth%20설정이%20필요합니다");
  const redirectUri=process.env.GOOGLE_REDIRECT_URI||new URL("/api/auth/google/callback",request.url).toString();
  try {
    const client=new OAuth2Client(clientId,clientSecret,redirectUri);
    const {tokens}=await client.getToken(code);
    if(!tokens.id_token) return go(request,"/login?error=Google%20인증%20토큰을%20받지%20못했습니다");
    const ticket=await client.verifyIdToken({idToken:tokens.id_token,audience:clientId});
    const claims=ticket.getPayload();
    if(!claims?.sub||!claims.email||claims.email_verified!==true||claims.nonce!==expectedNonce) return go(request,"/login?error=이메일%20인증%20또는%20요청%20검증에%20실패했습니다");
    const email=claims.email.trim().toLowerCase();
    let user=await prisma.userAccount.findUnique({where:{googleSubject:claims.sub}});
    if(user) {
      if(!user.active) return user.role === "가입 대기" ? pending(request,user.id) : go(request,"/login?error=비활성화된%20계정입니다");
      if(user.email!==email) user=await prisma.userAccount.update({where:{id:user.id},data:{email,username:email,displayName:claims.name||user.displayName}});
    } else {
      user=await prisma.userAccount.findFirst({where:{OR:[{email},{username:email}]}});
      if(user) {
        if(!user.active) return user.role === "가입 대기" ? pending(request,user.id) : go(request,"/login?error=비활성화된%20계정입니다");
        if(user.googleSubject&&user.googleSubject!==claims.sub) return go(request,"/login?error=다른%20Google%20계정에%20연결된%20이메일입니다");
        user=await prisma.userAccount.update({where:{id:user.id},data:{googleSubject:claims.sub}});
      } else {
        if(await prisma.userAccount.count()>0) {
          user=await prisma.userAccount.create({data:{username:email,email,googleSubject:claims.sub,displayName:claims.name||email,companyName:"",department:"",employeeNo:null,phone:"",passwordHash:hashPassword(randomBytes(32).toString("hex")),profileComplete:false,role:"가입 대기",active:false}});
          return pending(request,user.id);
        }
        user=await prisma.userAccount.create({data:{username:email,email,googleSubject:claims.sub,displayName:claims.name||email,companyName:"",department:"",employeeNo:null,phone:"",passwordHash:hashPassword(randomBytes(32).toString("hex")),profileComplete:true,role:"관리자"}});
      }
    }
    const response=NextResponse.redirect(new URL(user.profileComplete ? "/" : "/account/profile",request.url));
    response.cookies.set(sessionCookie,makeSession(user.id),{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:SESSION_DURATION_SECONDS});
    return response;
  } catch {
    return go(request,"/login?error=Google%20로그인%20처리%20중%20오류가%20발생했습니다");
  }
}
