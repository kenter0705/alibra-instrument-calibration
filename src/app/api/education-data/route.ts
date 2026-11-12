import { sameOriginRequest } from "@/lib/request-origin";
import { educationUser } from "@/lib/education-auth";
import { listDatasets, readDataset, saveDataset } from "@/lib/education-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { await educationUser(); } catch { return Response.json({ error: "로그인이 필요합니다." }, { status: 401 }); }
  const id = new URL(request.url).searchParams.get("id");
  try { return Response.json(id ? await readDataset(id) : await listDatasets(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "자료를 찾을 수 없습니다." }, { status: 404 }); }
}
export async function POST(request: Request) {
  let user;
  try { user = await educationUser(); } catch { return Response.json({ error: "로그인이 필요합니다." }, { status: 401 }); }
  if (!sameOriginRequest(request)) return Response.json({ error: "현재 CALIBRA 화면에서 저장하세요." }, { status: 403 });
  try {
    const text = await request.text(); if (text.length > 5_000_000) throw new Error("데이터가 너무 큽니다. 5000행 이하로 나눠 저장하세요.");
    return Response.json(await saveDataset(JSON.parse(text), user), { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "저장에 실패했습니다." }, { status: 400 }); }
}
