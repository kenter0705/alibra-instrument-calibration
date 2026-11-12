import assert from "node:assert/strict";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import { Prisma } from "../src/generated/prisma";
import { prisma } from "../src/lib/prisma";
import { getBoardExportRecords } from "../src/lib/board-export-data";
import { postsExcel, postsPdf, exportValue } from "../src/lib/board-export-render";

function fixture(modelName:string, overrides:Record<string,unknown>={}) {
 const model=Prisma.dmmf.datamodel.models.find(model=>model.name===modelName)!;
 return Object.fromEntries(model.fields.filter(field=>field.kind!=="object"&&field.isRequired&&!field.hasDefaultValue&&!field.isList).map(field=>[field.name,field.type==="DateTime"?new Date("2026-11-12T01:02:03Z"):field.type==="Int"||field.type==="Float"?1:field.type==="Boolean"?true:`QA-${field.name}-${randomUUID()}`]).concat(Object.entries(overrides))) as any;
}
async function main(){
 assert.ok(process.env.DATABASE_URL?.includes("classroom-qa"),"Synthetic QA DB only");
 const instrument=await prisma.instrument.create({data:fixture("Instrument",{assetCode:`BULK-${randomUUID()}`,name:"일괄 검증 계측기",measurementRange:"0~100",measurementUnit:"mm",resolution:"0.01",serialNumber:"QA-SERIAL-END"})});
 const provider=await prisma.calibrationProvider.create({data:fixture("CalibrationProvider",{name:"검증용 기관",accreditationNumber:"QA-ACC-END"})});
 const procedure=await prisma.calibrationProcedure.create({data:fixture("CalibrationProcedure",{title:"검교정 전체 절차",steps:"절차 전체 항목 마지막_PROCEDURE_END"})});
 const grr=await prisma.gageRRStudy.create({data:fixture("GageRRStudy",{instrumentId:instrument.id,instrumentName:instrument.name,title:"연계 GRR 원자료",data:JSON.stringify({parts:[1,2],operators:["A","B"],values:[0,1,2,3],last:"GRR_DATA_END"})})});
 const calibrationIds:string[]=[],qualificationIds:string[]=[];
 for(let index=1;index<=13;index++){
  const record=await prisma.calibrationRecord.create({data:fixture("CalibrationRecord",{instrumentId:instrument.id,providerId:provider.id,procedureId:procedure.id,certificateNumber:`QA-CAL-${index}-${randomUUID()}`,cost:0,notes:`검교정 ${index}의 모든 항목\n`+"긴 내용 X<Y and Z>0 10.25 mm를 보존합니다. ".repeat(20)+`CAL_RECORD_${index}_END`})});calibrationIds.push(record.id);
  const qualification=await prisma.processQualification.create({data:fixture("ProcessQualification",{qualificationNo:`QA-SPQ-${index}-${randomUUID()}`,instrumentId:instrument.id,grrStudyId:grr.id,processName:`특별특성 검증 ${index}`,operatorName:"작업자1",operatorName2:"작업자2",operatorName3:"작업자3",operatorName4:"작업자4",operatorName5:"작업자5",operatorExperienceYears5:0,detectionSampleCount:2,detectionDefects:0,detectionCorrect:2,detectionMissed:0,detectionFalseAlarm:0,detectionSheetData:JSON.stringify({rows:[{sample:1,reference:0,result:0},{sample:2,reference:1,result:1}],end:`SHEET_${index}_END`}),notes:"전체 내용 보존 ".repeat(20)+`SPQ_RECORD_${index}_END`})});qualificationIds.push(qualification.id);
 }
 const output=path.join(process.cwd(),"tmp/pdfs/bulk-validation");await mkdir(output,{recursive:true});
 for(const [board,ids,title] of [["calibrations",calibrationIds,"검교정 이력"],["qualifications",qualificationIds,"특별특성 자격인정"]] as const){
  const all=await getBoardExportRecords(board);const selected=all.filter(record=>ids.includes(record.id));assert.equal(selected.length,13,"All pages must be included");
  const modelName=board==="calibrations"?"CalibrationRecord":"ProcessQualification";
  const required=Prisma.dmmf.datamodel.models.find(model=>model.name===modelName)!.fields.filter(field=>field.kind!=="object").map(field=>field.name);
  for(const record of selected){for(const field of required)assert.ok(record.fields.some(item=>item.key===field),`Missing ${board}.${field}`);assert.ok(record.fields.some(field=>field.key==="instrument.serialNumber"&&field.value==="QA-SERIAL-END"));
   if(board==="calibrations"){assert.ok(record.fields.some(field=>field.key==="procedure.steps"));assert.ok(record.fields.some(field=>field.key==="provider.accreditationNumber"))}else{assert.ok(record.fields.some(field=>field.key==="grrStudy.data"));assert.ok(record.fields.some(field=>field.key==="operatorName5"));}
  }
  const before=JSON.stringify(selected);const bytes=await postsExcel(title,selected),workbook=new ExcelJS.Workbook();await workbook.xlsx.load(bytes as any);
  assert.equal(workbook.getWorksheet("게시글 목록")!.rowCount,14);assert.ok(workbook.getWorksheet("전체 항목 표")!.columnCount>40);
  const body=workbook.getWorksheet("게시글 전체 내용")!;
  for(const record of selected)for(const field of record.fields){let reconstructed="";body.eachRow(row=>{if(row.getCell(1).text===record.id&&(row.getCell(3).text===field.label||row.getCell(3).text.startsWith(field.label+" (")))reconstructed+=row.getCell(4).text});assert.equal(reconstructed,exportValue(field.value),`${board}: full ${field.key}`)}
  const pdf=await postsPdf(title,selected);assert.ok((await PDFDocument.load(pdf)).getPageCount()>=13);
  await writeFile(path.join(output,board+".xlsx"),bytes);await writeFile(path.join(output,board+".pdf"),pdf);
  assert.equal(JSON.stringify((await getBoardExportRecords(board)).filter(record=>ids.includes(record.id))),before,"Export must not modify any record");
  console.log(`PASS ${board}: 13 records beyond a 10-row page; every scalar field, instrument/linked details, all long text, wide Excel table and multi-page Korean PDF; source records unchanged`);
 }
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>prisma.$disconnect());
