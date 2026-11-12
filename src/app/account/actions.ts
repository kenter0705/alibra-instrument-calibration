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
    if (activeAdmins <= 1) redirect("/account?error=마지막%20활성%20관리자는%20먼저%20다른%20관리자를%20지정해야%20탈퇴할%20수%20있습니다");
  }
  // This account table has no business-record relations. Delete personal and
  // authentication fields on withdrawal; calibration/business records remain.
  await prisma.userAccount.delete({ where: { id: user.id } });
  jar.delete(SESSION_COOKIE);
  redirect("/login?withdrawn=1");
}
