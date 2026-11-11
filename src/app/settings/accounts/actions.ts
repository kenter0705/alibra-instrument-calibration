"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { validSession } from "@/lib/auth";

async function getActiveUser() {
  const token = (await cookies()).get("calibra_session")?.value || "";
  if (!validSession(token)) redirect("/login");
  const user = await prisma.userAccount.findUnique({ where: { id: token.split(".")[0] } });
  if (!user?.active) redirect("/login");
  return user;
}

export async function changeAccountStatus(form: FormData) {
  const actor = await getActiveUser();
  if (actor.role !== "관리자") redirect("/account?error=관리자만%20사용자%20승인을%20관리할%20수%20있습니다");
  const id = String(form.get("id") || "");
  const operation = String(form.get("operation") || "");
  const target = await prisma.userAccount.findUnique({ where: { id } });
  if (!target) redirect("/settings/accounts?error=계정을%20찾을%20수%20없습니다");
  if (target.id === actor.id) redirect("/settings/accounts?error=현재%20로그인한%20관리자%20계정은%20여기서%20변경할%20수%20없습니다");
  if (operation === "approve") {
    if (target.active || target.role !== "가입 대기") redirect("/settings/accounts?error=승인%20대기%20중인%20계정만%20승인할%20수%20있습니다");
    await prisma.userAccount.update({ where: { id }, data: { active: true, role: "사용자" } });
  } else if (operation === "suspend") {
    if (target.active && target.role === "관리자") {
      const admins = await prisma.userAccount.count({ where: { active: true, role: "관리자" } });
      if (admins <= 1) redirect("/settings/accounts?error=마지막%20활성%20관리자는%20중지할%20수%20없습니다");
    }
    await prisma.userAccount.update({ where: { id }, data: { active: false, role: "중지" } });
  } else if (operation === "restore") {
    await prisma.userAccount.update({ where: { id }, data: { active: true, role: "사용자" } });
  }
  redirect("/settings/accounts?saved=1");
}
