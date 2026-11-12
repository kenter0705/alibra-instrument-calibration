import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import ExcelJS from "exceljs";
import { chartTypes, exampleData, validateData, type ChartType } from "../src/lib/education-data";
import { sampleData } from "../src/lib/sample-data";

async function main(){
 const root=path.join(process.cwd(),"public/example-data");const files=path.join(root,"files");await mkdir(files,{recursive:true});
 const masters=[];const manifest=[];
 for(const chart of Object.keys(chartTypes) as ChartType[]){
  const data=exampleData(chart);validateData(data);const entry=sampleData[chart];
  const json=JSON.stringify({...data,title:entry.title,description:"합성 학습용 원본 샘플. 원본은 덮어쓰지 않고 사본을 다른 이름으로 저장하세요."},null,2)+"\n";
  const csv="\uFEFF"+[data.columns,...data.rows].map(row=>row.map(value=>'"'+value.replace(/"/g,'""')+'"').join(",")).join("\r\n")+"\r\n";
  const book=new ExcelJS.Workbook();book.creator="CALIBRA";book.created=new Date("2026-11-12T00:00:00Z");book.modified=book.created;
  const sheet=book.addWorksheet("데이터");sheet.addRow(data.columns);
  for(const row of data.rows)sheet.addRow(row.map((value,index)=>["그룹","불량유형","원인분류","원인","부품","측정자"].includes(data.columns[index])?value:Number(value)));
  sheet.columns.forEach(column=>{column.width=22});sheet.views=[{state:"frozen",ySplit:1}];sheet.getRow(1).font={name:"맑은 고딕",bold:true};
  const guide=book.addWorksheet("사용 안내");guide.columns=[{width:24},{width:80}];guide.addRows([["그래프",chartTypes[chart].label],["그래프 코드",chart],["데이터 구분",chartTypes[chart].type],["단위",data.unit||""],["규격 하한",data.lowerSpec??""],["규격 상한",data.upperSpec??""],["원본 보존","읽기 전용 원본입니다. 수정 내용은 반드시 다른 이름의 사본으로 저장하세요."],["불러오기","JSON은 그래프를 자동 인식합니다. CSV·엑셀은 앱에서 같은 그래프를 선택한 뒤 불러오세요."]]);
  const payloads={json:Buffer.from(json,"utf8"),csv:Buffer.from(csv,"utf8"),xlsx:Buffer.from(await book.xlsx.writeBuffer())};const hashes:Record<string,string>={};
  for(const [extension,bytes] of Object.entries(payloads)){const name=entry.title+"."+extension;await writeFile(path.join(files,name),bytes,{flag:"wx"}).catch(async error=>{if(error.code!=="EEXIST")throw error});hashes[extension]=createHash("sha256").update(await readFile(path.join(files,name))).digest("hex")}
  masters.push({...data,id:entry.id,title:entry.title,kind:"original",createdAt:"2026-11-12T00:00:00.000Z",author:"CALIBRA 원본 샘플",authorId:"calibra-sample-master",originalFile:entry.id+".json",sampleKey:chart});
  manifest.push({chart,id:entry.id,title:entry.title,type:chartTypes[chart].type,files:Object.keys(payloads).map(extension=>entry.title+"."+extension),sha256:hashes});
 }
 await writeFile(path.join(root,"manifest.json"),JSON.stringify({version:1,samples:manifest},null,2));
 await writeFile(path.join(root,"master-records.json"),JSON.stringify(masters,null,2));
 await writeFile(path.join(root,"예시 데이터 안내.txt"),"CALIBRA 퍼스널·멀티 공통 예시 데이터\r\n원본 샘플은 읽기 전용입니다. 원본을 덮어쓰지 마세요.\r\n앱의 데이터 불러오기 → 원본 샘플 불러오기 또는 파일 불러오기 → 사본으로 수정 → 다른 이름으로 저장 순서로 사용하세요.\r\nJSON은 그래프와 규격·단위를 자동으로 인식합니다. CSV·엑셀은 같은 그래프를 선택한 뒤 불러오세요.\r\n앱에서 다른 이름으로 저장하면 수정본 목록에 새 자료로 보관됩니다. 파일로도 보관하려면 CSV/JSON 내보내기를 사용하세요.\r\n");
 console.log("Built 14 graph-specific originals in JSON, CSV and Excel (42 files); all templates validated");
}
main().catch(error=>{console.error(error);process.exitCode=1});
