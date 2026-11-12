import { sameOriginRequest } from "@/lib/request-origin";
import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { educationUser } from "@/lib/education-auth";
import { saveDataset } from "@/lib/education-store";
import { chartTypes, type ChartType, type DataContent } from "@/lib/education-data";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let user;
  try { user = await educationUser(); } catch { return Response.json({ error: "로그인이 필요합니다." }, { status: 401 }); }
  if (!sameOriginRequest(request)) return Response.json({ error: "현재 화면에서 불러오세요." }, { status: 403 });
  try {
    const form = await request.formData(); const upload = form.get("file");
    if (!(upload instanceof File) || !upload.size || upload.size > 10 * 1024 * 1024) throw new Error("10MB 이하의 CSV, XLSX, JSON 파일을 선택하세요.");
    const bytes = Buffer.from(await upload.arrayBuffer()); const extension = path.extname(upload.name).toLowerCase();
    let data: DataContent;
    if (extension === ".json") { data = JSON.parse(bytes.toString("utf8")); }
    else {
      let chart = String(form.get("chart")) as ChartType;
      let sample:DataContent|undefined;
      try{
        const root=path.join(process.cwd(),"public/example-data");
        const manifest=JSON.parse(await readFile(path.join(root,"manifest.json"),"utf8"));
        const digest=createHash("sha256").update(bytes).digest("hex");
        const entry=manifest.samples.find((entry:any)=>entry.files.includes(upload.name)&&entry.sha256[extension.slice(1)]===digest);
        if(entry){const originals=JSON.parse(await readFile(path.join(root,"master-records.json"),"utf8"));sample=originals.find((record:any)=>record.id===entry.id);if(sample)chart=sample.chart;}
      }catch{}
      if (!chartTypes[chart]) throw new Error("대상 그래프를 선택하세요.");
      const workbook = new ExcelJS.Workbook();
      if (extension === ".xlsx") await workbook.xlsx.load(bytes as any);
      else if (extension === ".csv") await workbook.csv.read(Readable.from(bytes));
      else throw new Error("CSV, XLSX, JSON 파일을 사용할 수 있습니다.");
      const sheet = workbook.worksheets[0]; if (!sheet || sheet.rowCount > 5001 || sheet.columnCount > 20) throw new Error("첫 시트에 5000행 이하의 그래프 양식 데이터를 넣으세요.");
      const matrix: string[][] = [];
      sheet.eachRow(row => { matrix.push(Array.from({ length: sheet.columnCount }, (_, i) => row.getCell(i + 1).text.trim())); });
      const columns = matrix.shift() || [];
      data = { chart, columns, rows: matrix, lowerSpec: sample?.lowerSpec??(form.get("lowerSpec") ? Number(form.get("lowerSpec")) : undefined), upperSpec: sample?.upperSpec??(form.get("upperSpec") ? Number(form.get("upperSpec")) : undefined), unit: sample?.unit??String(form.get("unit") || "") };
    }
    return Response.json(await saveDataset({ ...data, parentId: undefined, title: String(form.get("title") || path.basename(upload.name, extension)) }, user, { bytes, name: upload.name }), { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "파일을 불러오지 못했습니다." }, { status: 400 }); }
}
