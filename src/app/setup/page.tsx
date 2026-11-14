import { redirect } from "next/navigation";
import { IS_CLASSROOM, APP_NAME } from "@/lib/app-edition";
import { prisma } from "@/lib/prisma";
import { readFile } from "node:fs/promises";
import { timingSafeEqual } from "node:crypto";
import { getDataPath } from "@/lib/data-directory";
export const dynamic = "force-dynamic";
export default async function SetupPage({searchParams}:{searchParams:Promise<{error?:string;token?:string}>}) {
  if (await prisma.userAccount.count() > 0) redirect("/login");
  const query = await searchParams;
  const expected=await readFile(getDataPath("setup","first-admin-token.txt"),"utf8").then(value=>value.trim()).catch(()=>"");
  const supplied=Buffer.from(query.token||""),actual=Buffer.from(expected);
  if(!expected || supplied.length!==actual.length || !timingSafeEqual(supplied,actual))return <main className="auth-screen"><section className="auth-card"><h1>{APP_NAME}</h1><p>최초 관리자 등록은 설치 PC의 해당 앱 바탕화면 바로가기로 열어 주세요.</p></section></main>;
  return <main className="auth-screen"><section className="auth-card"><h1>{APP_NAME}</h1><h2>첫 관리자 등록</h2><p>{IS_CLASSROOM ? "서버 PC에서 수업을 관리할 계정을 직접 등록하세요. 퍼스널 계정·자료와는 별개입니다." : "이 PC에서 사용할 관리자 계정을 직접 등록하세요. 멀티 계정·자료와는 별개입니다."}</p>{query.error && <p className="auth-error">{query.error}</p>}<form action="/api/setup" method="post" className="network-connect-form"><input type="hidden" name="setupToken" value={query.token}/><label>이름<input name="displayName" autoComplete="name" required maxLength={80}/></label><label>이메일<input name="email" type="email" autoComplete="username" required maxLength={200}/></label><label>비밀번호<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={200} required/></label><label>비밀번호 확인<input name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={200} required/></label><button type="submit" className="primary-button">관리자 등록 후 시작</button></form>{IS_CLASSROOM && <p>등록 후 교육생의 가입 신청을 승인하고, ‘다수 사용하기’에서 사내망 접속을 설정하세요.</p>}</section></main>;
}
