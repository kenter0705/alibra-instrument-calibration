import { cookies } from "next/headers";
import { validSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function educationUser() {
  const token = (await cookies()).get("calibra_session")?.value || "";
  if (!validSession(token)) throw new Error("로그인이 필요합니다.");
  const user = await prisma.userAccount.findUnique({ where: { id: token.split(".")[0] }, select: { id: true, displayName: true, role: true, active: true } });
  if (!user?.active) throw new Error("사용 가능한 계정으로 로그인하세요.");
  return user;
}
export async function requireTrainingAdministrator() {
  const user = await educationUser();
  if (user.role !== "관리자") throw new Error("교육자료 원본은 관리자만 변경할 수 있습니다. 공동 데이터실에서 수정 사본을 만들어 사용하세요.");
  return user;
}
