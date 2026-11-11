import { networkInterfaces } from "node:os";
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { validSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const isLocal = (request: NextRequest) => ["localhost", "127.0.0.1", "[::1]"].includes(request.nextUrl.hostname);
const dataRoot = () => process.env.CALIBRA_DATA_DIR ? path.dirname(process.env.CALIBRA_DATA_DIR) : path.join(process.cwd(), ".calibra-local-settings");
async function administrator(request: NextRequest) {
  const token = request.cookies.get("calibra_session")?.value;
  if (!token || !validSession(token)) return false;
  const user = await prisma.userAccount.findUnique({ where: { id: token.split(".")[0] }, select: { active: true, role: true } });
  return Boolean(user?.active && user.role === "관리자");
}
export async function GET(request: NextRequest) {
  if (!isLocal(request)) return Response.json({ local: false, enabled: false, running: false, addresses: [], supported: false });
  if (!await administrator(request)) return Response.json({ error: "서버 PC에서 관리자 로그인 후 설정하세요." }, { status: 403 });
  let enabled = false;
  try { enabled = JSON.parse(await readFile(path.join(dataRoot(), "network-settings.json"), "utf8")).enabled === true; } catch {}
  const addresses = [...new Set(Object.values(networkInterfaces()).flatMap(items => items || []).filter(item => item.family === "IPv4" && !item.internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(item.address)).map(item => `http://${item.address}:${request.nextUrl.port || "3000"}/`))];
  const launcher = await readFile(path.join(dataRoot(), "Start-CALIBRA.ps1"), "utf8").catch(() => "");
  return Response.json({ local: true, enabled, running: process.env.CALIBRA_LAN_ENABLED === "true", addresses, supported: launcher.includes("network-settings.json") }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: NextRequest) {
  if (!isLocal(request) || request.headers.get("origin") !== request.nextUrl.origin) return Response.json({ error: "서버 PC의 로컬 주소에서만 변경할 수 있습니다." }, { status: 403 });
  if (!await administrator(request)) return Response.json({ error: "관리자만 공유 서버 설정을 변경할 수 있습니다." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.enabled !== "boolean") return Response.json({ error: "공유 설정 값을 확인하세요." }, { status: 400 });
  const root = dataRoot();
  const temporary = path.join(root, `network-settings-${crypto.randomUUID()}.tmp`);
  await mkdir(root, { recursive: true });
  await writeFile(temporary, JSON.stringify({ enabled: body.enabled }), "utf8");
  await rename(temporary, path.join(root, "network-settings.json"));
  return Response.json({ saved: true });
}
