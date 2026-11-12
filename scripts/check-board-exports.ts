import assert from "node:assert/strict";
import { mkdir,writeFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import { postsExcel,postsPdf,postText,exportValue } from "../src/lib/board-export-render";
import { exportBoards,isExportBoard,type ExportRecord } from "../src/lib/board-export-definitions";
import { getBoardSummaries,getBoardExportRecords } from "../src/lib/board-export-data";
import { prisma } from "../src/lib/prisma";
import { publicRequestOrigin,requestLink,sameOriginRequest,loopbackRequest } from "../src/lib/request-origin";

async function main(){
  assert.ok(process.env.DATABASE_URL?.includes("classroom-qa"),"Use only the isolated test database");
  const request=new Request("http://localhost:4104/api/test",{headers:{host:"127.0.0.1:4104",origin:"http://127.0.0.1:4104"}});
  assert.equal(publicRequestOrigin(request),"http://127.0.0.1:4104");assert.equal(requestLink(request,"/login").host,"127.0.0.1:4104");assert.equal(sameOriginRequest(request),true);assert.equal(loopbackRequest(request),true);
  assert.equal(sameOriginRequest(new Request("http://localhost:4104/",{headers:{host:"127.0.0.1:4104",origin:"http://localhost:3000"}})),false);
  assert.throws(()=>publicRequestOrigin(new Request("http://localhost:4104/",{headers:{host:"evil.invalid"}})));
  assert.equal(isExportBoard("UserAccount"),false);assert.equal(isExportBoard("__proto__"),false);
  for(const board of Object.keys(exportBoards) as (keyof typeof exportBoards)[])await getBoardSummaries(board);
  const fixture=await prisma.boardEntry.create({data:{boardKey:"qa-export",title:"등록 게시글 검증",contentHtml:"<p>변환용 합성 게시글</p>",createdBy:"test"}});
  const dbBefore=await prisma.boardEntry.findUniqueOrThrow({where:{id:fixture.id}});
  const selected=await getBoardExportRecords("posts",[fixture.id]);assert.equal(selected.length,1);assert.ok(selected[0].fields.some(field=>field.key==="contentHtml"));
  await assert.rejects(()=>getBoardExportRecords("posts",["missing-id"]));
  const longText="원문 보존과 공동 실습 데이터를 확인합니다. ".repeat(2300)+"끝_누락없음";
  const first:ExportRecord={id:"qa-post-1",title:"한글 게시글 변환 검증",writtenAt:"2026-11-12T01:02:03.000Z",fields:[{key:"contentHtml",label:"본문",value:longText},{key:"literal",label:"문자열",value:"=2+3"},{key:"number",label:"값",value:0}]};
  const excel=await postsExcel("검증 게시판",[first,...selected]);const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(excel as any);
  assert.equal(workbook.getWorksheet("게시글 목록")!.rowCount,3);
  const body=workbook.getWorksheet("게시글 전체 내용")!;let restored="",literalFound=false;
  body.eachRow(row=>{if(row.getCell(1).text===first.id&&row.getCell(3).text.startsWith("본문"))restored+=row.getCell(4).text;if(row.getCell(3).text==="문자열"){assert.equal(row.getCell(4).value,"=2+3");assert.equal(row.getCell(4).type,ExcelJS.ValueType.String);literalFound=true}assert.ok((row.height||0)<=400)});
  assert.equal(restored,longText);assert.equal(literalFound,true);assert.equal(postText("<p>평균 &lt; 10.5</p>X<Y and Z>0"),"평균 < 10.5\nX<Y and Z>0");assert.equal(exportValue(0),"0");
  const pdfRecord={...first,fields:[{key:"contentHtml",label:"본문",value:"<h2>원문 내용</h2><p>한글·숫자·기호 10.25 mm, σ, ±, 25명 공동 교육</p>"+Array.from({length:55},(_,i)=>`<p>${i+1}. 원본은 그대로 두고 다른 이름으로 저장합니다.</p>`).join("")},{key:"last",label:"검증",value:"마지막_내용_보존_END"}]};
  const single=await postsPdf("교육 교재 게시판",[pdfRecord]);const bulk=await postsPdf("교육 교재 게시판",[pdfRecord,{...pdfRecord,id:"qa-post-2",title:"두 번째 게시글",fields:[{key:"content",label:"본문",value:"선택 게시글을 같은 PDF로 묶었습니다."}]},{...pdfRecord,id:"qa-post-3",title:"마지막 게시글",fields:[{key:"content",label:"본문",value:"일괄 문서 마지막_END"}]}]);
  assert.ok((await PDFDocument.load(single)).getPageCount()>1);assert.ok((await PDFDocument.load(bulk)).getPageCount()>(await PDFDocument.load(single)).getPageCount());
  const output=path.join(process.cwd(),"tmp","pdfs");await mkdir(output,{recursive:true});await writeFile(path.join(output,"single-post.pdf"),single);await writeFile(path.join(output,"bulk-posts.pdf"),bulk);await writeFile(path.join(output,"posts.xlsx"),excel);
  assert.deepEqual(await prisma.boardEntry.findUniqueOrThrow({where:{id:fixture.id}}),dbBefore);
  console.log(JSON.stringify({boards:Object.keys(exportBoards).length,longExcelCharacters:longText.length,singlePdfPages:(await PDFDocument.load(single)).getPageCount(),bulkPdfPages:(await PDFDocument.load(bulk)).getPageCount(),checks:["Host-preserving redirects and strict origin checks","all board queries read-only","long post text fully preserved in Excel","Excel strings are not formulas","single/bulk Korean PDF generated","original post unchanged"]}));
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>prisma.$disconnect());
