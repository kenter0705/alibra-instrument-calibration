import ExcelJS from "exceljs";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { APP_NAME, APP_VERSION } from "@/lib/app-edition";
import type { ExportRecord } from "@/lib/board-export-definitions";

export function postText(input: string): string {
  return input.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>|<\/(?:p|div|li|h[1-6]|tr)>/gi, "\n").replace(/<li\b[^>]*>/gi, "- ").replace(/<\/?(?:p|div|span|br|b|strong|em|i|u|s|font|table|tbody|thead|tfoot|tr|td|th|ul|ol|li|h[1-6]|blockquote|pre|code|a|img|hr|section|article|figure|figcaption)(?:\s[^>]*|\/)?\s*>/gi, "")
    .replace(/&nbsp;/gi, " ").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&apos;|&#39;/gi, "'").replace(/&amp;/gi, "&")
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code: string) => { const value = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code); return value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : ""; })
    .replace(/\r\n?/g, "\n").replace(/\u0000/g, "");
}
export function exportValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (value instanceof Date) return new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "medium", timeZone: "Asia/Seoul" }).format(value) + " KST";
  if (typeof value === "object") return JSON.stringify(value, (_, item) => typeof item === "string" ? postText(item) : item, 2);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) { try { return exportValue(JSON.parse(trimmed)); } catch {} }
    return postText(value);
  }
  return String(value);
}
function chunks(value: string) { const parts: string[]=[];let part="",count=0,breaks=0;for(const char of Array.from(value)){part+=char;count++;if(char==="\n")breaks++;if(count>=400||breaks>=12){parts.push(part);part="";count=0;breaks=0}}if(part||!parts.length)parts.push(part);return parts; }
function visibleLines(value: string, width: number) { return value.split("\n").reduce((sum,line)=>sum+Math.max(1,Math.ceil(Array.from(line).reduce((n,char)=>n+(char.charCodeAt(0)>0x2ff?2:1),0)/width)),0); }
export async function postsExcel(title: string, records: ExportRecord[]) {
  const workbook = new ExcelJS.Workbook(); workbook.creator = APP_NAME; workbook.subject = title; workbook.created = new Date();
  const summary = workbook.addWorksheet("게시글 목록"); summary.columns = [{ header: "자료 번호", key: "id", width: 30 }, { header: "제목", key: "title", width: 55 }, { header: "작성·수정 시각", key: "writtenAt", width: 30 }];
  for (const record of records) { const row=summary.addRow({ id: record.id, title: postText(record.title), writtenAt: record.writtenAt });row.height=Math.min(400,Math.max(28,visibleLines(postText(record.title),55)*14+8)); }
  summary.autoFilter = { from: "A1", to: "C1" }; summary.views = [{ state: "frozen", ySplit: 1 }];
  const body = workbook.addWorksheet("게시글 전체 내용"); body.columns = [{ header: "자료 번호", width: 28 }, { header: "제목", width: 38 }, { header: "항목", width: 27 }, { header: "내용", width: 90 }]; body.views = [{ state: "frozen", ySplit: 1 }];
  for (const record of records) {
    const section = body.addRow([record.id, postText(record.title), "게시글", ""]); section.height=Math.min(400,Math.max(30,visibleLines(postText(record.title),38)*14+8)); section.font = { name: "맑은 고딕", bold: true, color: { argb: "FF17365D" } }; section.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF0F8" } };
    for (const field of record.fields) {
      const pieces = chunks(exportValue(field.value));
      pieces.forEach((piece, i) => { const row = body.addRow([record.id, postText(record.title), field.label + (pieces.length > 1 ? ` (${i + 1}/${pieces.length})` : ""), piece]);row.height=Math.min(400,Math.max(30,Math.max(visibleLines(piece,85),visibleLines(postText(record.title),38),visibleLines(field.label,27))*14+8)); });
    }
  }
  for (const sheet of [summary, body]) { sheet.properties.defaultRowHeight = 25; sheet.eachRow(row => row.eachCell(cell => { cell.font = { name: "맑은 고딕", size: 10, ...cell.font }; cell.alignment = { vertical: "top", wrapText: true }; })); const header = sheet.getRow(1); header.height = 28; header.font = { name: "맑은 고딕", bold: true, color: { argb: "FFFFFFFF" } }; header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17365D" } }; sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 }; }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
async function koreanFonts() {
  const candidates = [process.env.CALIBRA_PDF_FONT, path.join(process.env.WINDIR || "C:\\Windows", "Fonts", "malgun.ttf"), "/usr/share/fonts/truetype/nanum/NanumGothic.ttf"].filter(Boolean) as string[];
  for (const file of candidates) { try { return { regular: await readFile(file), bold: await readFile(file.replace(/malgun\.ttf$/i, "malgunbd.ttf")).catch(() => readFile(file)) }; } catch {} }
  throw new Error("서버에서 한글 PDF 글꼴을 찾지 못했습니다. 맑은 고딕 또는 CALIBRA_PDF_FONT 설정을 확인하세요.");
}
export async function postsPdf(title: string, records: ExportRecord[]) {
  const document = await PDFDocument.create(); document.registerFontkit(fontkit); document.setTitle(`${title} 게시글`); document.setAuthor(APP_NAME); document.setCreator(`${APP_NAME} ${APP_VERSION}`); document.setLanguage("ko-KR");
  const bytes = await koreanFonts(); const regular = await document.embedFont(bytes.regular, { subset: true }), bold = await document.embedFont(bytes.bold, { subset: true });
  const width = 595.28, height = 841.89, left = 44, right = 44, bottom = 60; let page: PDFPage, y = 0, recordNumber = 0;
  const widths = new Map<string, number>();
  function newPage() { page = document.addPage([width, height]); page.drawText(APP_NAME, { x: left, y: height - 35, size: 8, font: regular, color: rgb(.36, .43, .53) }); page.drawLine({ start: { x: left, y: height - 45 }, end: { x: width - right, y: height - 45 }, thickness: .6, color: rgb(.82, .87, .93) }); y = height - 72; }
  function lines(text: string, font: PDFFont, size: number) {
    const result: string[] = [];
    for (const paragraph of text.split("\n")) { let line = "", used = 0; for (const char of Array.from(paragraph)) { const key = font.name + ":" + size + ":" + char; let amount = widths.get(key); if (amount === undefined) { amount = font.widthOfTextAtSize(char, size); widths.set(key, amount); } if (line && used + amount > width - left - right - 4) { result.push(line); line = ""; used = 0; } line += char; used += amount; } result.push(line); }
    return result;
  }
  function text(value: string, font: PDFFont, size: number, color = rgb(.14, .18, .24)) { for (const line of lines(value, font, size)) { if (y - size * 1.55 < bottom) newPage(); page.drawText(line, { x: left, y, size, font, color }); y -= size * 1.55; } }
  for (const record of records) {
    recordNumber++; newPage(); text(`${title} - 게시글 ${recordNumber}/${records.length}`, regular, 9, rgb(.25, .42, .77)); y -= 7; text(postText(record.title), bold, 17); y -= 6; text(`자료 번호: ${record.id}`, regular, 8); if (record.writtenAt) text(`작성·수정: ${record.writtenAt}`, regular, 8); y -= 14;
    for (const field of record.fields) { if (y < bottom + 45) newPage(); text(field.label, bold, 10, rgb(.09, .21, .36)); text(exportValue(field.value), regular, 10); y -= 11; }
  }
  const pages = document.getPages(); pages.forEach((item, i) => { item.drawLine({ start: { x: left, y: 47 }, end: { x: width - right, y: 47 }, thickness: .5, color: rgb(.82, .87, .93) }); item.drawText(`${APP_NAME} ${APP_VERSION}  |  ${i + 1} / ${pages.length}`, { x: left, y: 32, size: 8, font: regular, color: rgb(.36, .43, .53) }); });
  return Buffer.from(await document.save());
}
