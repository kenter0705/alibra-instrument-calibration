import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { service: "calibra-local", buildId: process.env.CALIBRA_BUILD_ID || "dev" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
