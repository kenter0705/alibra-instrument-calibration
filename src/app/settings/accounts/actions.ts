"use server";
import { SESSION_COOKIE, appCookie } from "@/lib/app-edition";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { validSession } from "@/lib/auth";

async function getActiveUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value || "";
  if (!validSession(token)) redirect("/login");
  const user = await prisma.userAccount.findUnique({ where: { id: token.split(".")[0] } });
  if (!user?.active) redirect("/login");
  return user;
}

export async function changeAccountStatus(form: FormData) {
  const actor = await getActiveUser();
  if (actor.role !== "관리자") redirect("/account?error=%EA%B4%80%EB%A6%AC%EC%9E%90%EB%A7%8C%20%EC%82%AC%EC%9A%A9%EC%9E%90%20%EC%8A%B9%EC%9D%B8%EC%9D%84%20%EA%B4%80%EB%A6%AC%ED%95%A0%20%EC%88%98%20%EC%9E%88%EC%8A%B5%EB%8B%88%EB%8B%A4");
  const id = String(form.get("id") || "");
  const operation = String(form.get("operation") || "");
  const target = await prisma.userAccount.findUnique({ where: { id } });
  if (!target) redirect("/settings/accounts?error=%EA%B3%84%EC%A0%95%EC%9D%84%20%EC%B0%BE%EC%9D%84%20%EC%88%98%20%EC%97%86%EC%8A%B5%EB%8B%88%EB%8B%A4");
  if (target.id === actor.id) redirect("/settings/accounts?error=%ED%98%84%EC%9E%AC%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%ED%95%9C%20%EA%B4%80%EB%A6%AC%EC%9E%90%20%EA%B3%84%EC%A0%95%EC%9D%80%20%EC%97%AC%EA%B8%B0%EC%84%9C%20%EB%B3%80%EA%B2%BD%ED%95%A0%20%EC%88%98%20%EC%97%86%EC%8A%B5%EB%8B%88%EB%8B%A4");
  if (operation === "approve") {
    if (target.active || target.role !== "가입 대기") redirect("/settings/accounts?error=%EC%8A%B9%EC%9D%B8%20%EB%8C%80%EA%B8%B0%20%EC%A4%91%EC%9D%B8%20%EA%B3%84%EC%A0%95%EB%A7%8C%20%EC%8A%B9%EC%9D%B8%ED%95%A0%20%EC%88%98%20%EC%9E%88%EC%8A%B5%EB%8B%88%EB%8B%A4");
    await prisma.userAccount.update({ where: { id }, data: { active: true, role: "사용자" } });
  } else if (operation === "suspend") {
    if (target.active && target.role === "관리자") {
      const admins = await prisma.userAccount.count({ where: { active: true, role: "관리자" } });
      if (admins <= 1) redirect("/settings/accounts?error=%EB%A7%88%EC%A7%80%EB%A7%89%20%ED%99%9C%EC%84%B1%20%EA%B4%80%EB%A6%AC%EC%9E%90%EB%8A%94%20%EC%A4%91%EC%A7%80%ED%95%A0%20%EC%88%98%20%EC%97%86%EC%8A%B5%EB%8B%88%EB%8B%A4");
    }
    await prisma.userAccount.update({ where: { id }, data: { active: false, role: "중지" } });
  } else if (operation === "restore") {
    await prisma.userAccount.update({ where: { id }, data: { active: true, role: "사용자" } });
  }
  redirect("/settings/accounts?saved=1");
}
