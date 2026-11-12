import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { APP_EDITION, APP_VERSION } from "@/lib/app-edition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buildId = await readFile(path.join(process.cwd(), process.env.CALIBRA_BUILD_DIR || ".calibra-build", "BUILD_ID"), "utf8").then(value => value.trim()).catch(() => "dev");
  return NextResponse.json(
    { service: "calibra-local", edition: APP_EDITION, version: APP_VERSION, buildId },
    { headers: { "Cache-Control": "no-store" } },
  );
}
