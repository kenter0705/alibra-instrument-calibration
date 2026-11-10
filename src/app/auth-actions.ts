"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { validSession } from "@/lib/auth";
const cookieName="calibra_session";
export async function signOut(){const jar=await cookies();jar.delete(cookieName);redirect("/login");}
export async function completeAccountProfile(form:FormData){const jar=await cookies();const token=jar.get(cookieName)?.value||"";if(!validSession(token))redirect("/login");const userId=token.split(".")[0];const companyName=String(form.get("companyName")||"").trim(),department=String(form.get("department")||"").trim(),displayName=String(form.get("displayName")||"").trim(),employeeNo=String(form.get("employeeNo")||"").trim(),phone=String(form.get("phone")||"").trim();if(!companyName||!department||!displayName||!employeeNo||!phone)throw new Error("회사명, 부서, 이름, 사번, 전화번호를 모두 입력해 주세요.");const duplicate=await prisma.userAccount.findFirst({where:{employeeNo,id:{not:userId}}});if(duplicate)throw new Error("이미 등록된 사번입니다.");await prisma.userAccount.update({where:{id:userId},data:{companyName,department,displayName,employeeNo,phone,profileComplete:true}});revalidatePath("/account/profile");redirect("/quality");}

