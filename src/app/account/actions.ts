"use server";
import { SESSION_COOKIE, appCookie } from "@/lib/app-edition";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { validSession } from "@/lib/auth";

export async function withdrawAccount() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value || "";
  if (!validSession(token)) redirect("/login");
  const user = await prisma.userAccount.findUnique({ where: { id: token.split(".")[0] } });
  if (!user?.active) redirect("/login");
  if (user.role === "관리자") {
    const activeAdmins = await prisma.userAccount.count({ where: { active: true, role: "관리자" } });
    if (activeAdmins <= 1) redirect("/account?error=%EB%A7%88%EC%A7%80%EB%A7%89%20%ED%99%9C%EC%84%B1%20%EA%B4%80%EB%A6%AC%EC%9E%90%EB%8A%94%20%EB%A8%BC%EC%A0%80%20%EB%8B%A4%EB%A5%B8%20%EA%B4%80%EB%A6%AC%EC%9E%90%EB%A5%BC%20%EC%A7%80%EC%A0%95%ED%95%B4%EC%95%BC%20%ED%83%88%ED%87%B4%ED%95%A0%20%EC%88%98%20%EC%9E%88%EC%8A%B5%EB%8B%88%EB%8B%A4");
  }
  // This account table has no business-record relations. Delete personal and
  // authentication fields on withdrawal; calibration/business records remain.
  await prisma.userAccount.delete({ where: { id: user.id } });
  jar.delete(SESSION_COOKIE);
  redirect("/login?withdrawn=1");
}
