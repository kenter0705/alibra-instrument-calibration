import {chartTypes,validateData,type ChartType,type DataContent} from "@/lib/education-data";
import {spcInputTemplates} from "@/lib/spc-input-template";

function localCopyId(){return globalThis.crypto?.randomUUID?.()??Date.now().toString(36)+"-"+Array.from(globalThis.crypto.getRandomValues(new Uint32Array(4)),value=>value.toString(36)).join("-")}
const issuedCopyNames=new Set<string>();
export function downloadSpcCopy(data:object,title:string){
 const copyId=localCopyId(),info=data as Record<string,unknown>,names:Record<string,string>={"xbar-r":"Xbar-R","xbar-s":"Xbar-S","i-mr":"I-MR",p:"P",np:"Pn",c:"C",u:"U",capability:"공정능력",normal:"정규분포",probability:"정규확률도",deviation:"Z값",binomial:"이항분포",sampling:"샘플링",poisson:"포아송",chi:"카이제곱",f:"F분포"};
 const key=typeof info.activeTool==="string"?info.activeTool:typeof info.tool==="string"?info.tool:info.tool===6?String(info.chartMode):"",label=(names[key]??(typeof info.tool==="number"?["체크시트","파레토","히스토그램","특성요인도","산점도","층별"][info.tool]:undefined)??title.replace(/원본|예시|수정본|사본/g,"").replace(/[^\p{L}\p{N}-]/gu,"").slice(0,12))||"SPC";
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Seoul",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date()),part=(name:string)=>parts.find(value=>value.type===name)?.value??"00",stamp=part("month")+part("day")+"-"+part("hour")+part("minute"),suffix=copyId.replace(/-/g,"").slice(-4),stem=label+"_"+stamp+"_"+suffix;let filename=stem+".json",sequence=1;while(issuedCopyNames.has(filename))filename=stem+"_"+(sequence++).toString(36)+".json";issuedCopyNames.add(filename);
 const url=URL.createObjectURL(new Blob([JSON.stringify({...data,copyId,savedAt:new Date().toISOString()},null,2)],{type:"application/json;charset=utf-8"}));
 const link=document.createElement("a");link.href=url;link.download=filename;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);return filename;
}
function csvRows(text:string){
 const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(!quoted&&(c===','||c==='\t')){row.push(cell.trim());cell=""}else if(!quoted&&(c==='\r'||c==='\n')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell=""}else cell+=c}
 if(quoted)throw new Error("CSV 따옴표를 확인하세요.");row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
}
export async function readSpcLocalFile(file:File,chart:ChartType,templateId?:string,columnAliases?:string[]){
 if(!file.size||file.size>10*1024*1024)throw new Error("10MB 이하의 JSON·CSV·엑셀 파일을 선택하세요.");
 let data:DataContent,spcTemplate:typeof spcInputTemplates[number]|undefined;
 if(file.name.toLowerCase().endsWith('.json'))data=JSON.parse(await file.text());
 else{
  let matrix:string[][];
  if(file.name.toLowerCase().endsWith('.csv'))matrix=csvRows((await file.text()).replace(/^\uFEFF/,''));
  else if(file.name.toLowerCase().endsWith('.xlsx')){
   const imported=await import('exceljs'),ExcelJS=imported.default||imported,workbook=new ExcelJS.Workbook();await workbook.xlsx.load(await file.arrayBuffer());const sheet=workbook.worksheets[0];
   if(!sheet||sheet.rowCount>5005||sheet.columnCount>20)throw new Error("입력표는 5000행·20열 이하로 작성하세요.");
   if(sheet.getCell('A1').text.endsWith('입력표')){spcTemplate=spcInputTemplates.find(item=>item.sheet===sheet.name);if(!spcTemplate)throw new Error("입력표 시트 이름을 확인하세요.");chart=spcTemplate.chart as ChartType;}
   matrix=[];sheet.eachRow((row,index)=>{if(spcTemplate&&index<5)return;const cells=Array.from({length:spcTemplate?.columns.length??sheet.columnCount},(_,i)=>row.getCell(i+1).text.trim());if(cells.some(Boolean))matrix.push(cells)});
  }else throw new Error("JSON·CSV·XLSX 파일을 선택하세요.");
  let columns=matrix.shift()||[];
  if(!spcTemplate&&templateId){const candidate=spcInputTemplates.find(item=>item.id===templateId);if(candidate&&candidate.columns.join("|")===columns.join("|")){spcTemplate=candidate;chart=candidate.chart as ChartType;}}
  if(spcTemplate&&columns.join('|')!==spcTemplate.columns.join('|'))throw new Error("입력표 열 제목을 변경하지 마세요.");
  if(spcTemplate&&(spcTemplate.id==='xbar-r'||spcTemplate.id==='xbar-s')){
   matrix.forEach((row,index)=>{if(row.some(v=>!v)||!Number.isInteger(Number(row[0]))||Number(row[0])<=0||(index>0&&Number(row[0])<=Number(matrix[index-1][0])))throw new Error("부분군 번호와 모든 측정값을 순서대로 입력하세요.")});
   matrix=matrix.flatMap(row=>row.slice(1).map(value=>[value]));columns=['측정값'];
  }
  data={chart,columns,rows:matrix};
 }
 if(columnAliases&&data.columns?.join("|")===columnAliases.join("|"))data={...data,columns:[...chartTypes[chart].columns]};
 if(!chartTypes[data.chart])throw new Error("통계 도구에 맞는 양식을 선택하세요.");if(columnAliases){if(data.columns.join("|")!==chartTypes[chart].columns.join("|")||!Array.isArray(data.rows)||data.rows.length<1||data.rows.length>5000||data.rows.some(row=>row.length!==2||row.some(value=>!value.trim()||!Number.isFinite(Number(value)))))throw new Error("도구에 맞는 두 열의 숫자 자료를 1~5000행 입력하세요.")}else validateData(data);
 return {...data,id:'local:'+localCopyId(),title:file.name.replace(/\.[^.]+$/,''),spcTemplate};
}
