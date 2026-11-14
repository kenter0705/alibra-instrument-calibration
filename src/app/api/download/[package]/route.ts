import { APP_DOWNLOAD_URL } from "@/lib/app-edition";
import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const packages: Record<string, string> = {
  mobile: "CALIBRA-Mobile.zip",
};

async function findPackage(packageName: string) {
  if (packageName !== "windows") return packages[packageName];
  const directory = join(process.cwd(), "public", "downloads");
  const files = await readdir(directory).catch(() => []);
  return files
    .filter((name) => /^CALIBRA-Setup-v\d+\.\d+\.\d+-\d{8}\.zip$/i.test(name))
    .sort((left, right) => right.localeCompare(left))[0];
}

async function fileResponse(request: Request, packageName: string, headOnly = false) {
  if(packageName === "windows") return Response.redirect(APP_DOWNLOAD_URL,307);
  const fileName = await findPackage(packageName);
  if (!fileName) return new Response("Not found", { status: 404 });

  const filePath = join(process.cwd(), "public", "downloads", fileName);
  let size: number;
  try {
    size = (await stat(filePath)).size;
  } catch {
    return new Response("Package not found", { status: 404 });
  }

  const range = request.headers.get("range");
  let start = 0;
  let end = size - 1;
  let status = 200;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    if (!match[1]) {
      const suffixLength = Number(match[2]);
      start = Math.max(0, size - suffixLength);
    } else {
      start = Number(match[1]);
      if (match[2]) end = Math.min(size - 1, Number(match[2]));
    }
    if (start >= size || end < start) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    status = 206;
  }

  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-cache",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Content-Length": String(end - start + 1),
    "Content-Type": "application/zip",
    "X-Content-Type-Options": "nosniff",
  });
  if (status === 206) headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  if (headOnly) return new Response(null, { status, headers });

  const stream = createReadStream(filePath, { start, end });
  return new Response(Readable.toWeb(stream) as ReadableStream, { status, headers });
}

export async function GET(request: Request, { params }: { params: Promise<{ package: string }> }) {
  const { package: packageName } = await params;
  return fileResponse(request, packageName);
}

export async function HEAD(request: Request, { params }: { params: Promise<{ package: string }> }) {
  const { package: packageName } = await params;
  return fileResponse(request, packageName, true);
}
