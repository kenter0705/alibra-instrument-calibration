import { NextRequest,NextResponse } from "next/server";
import ExcelJS from "exceljs";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime="nodejs";
const normal=(v:ExcelJS.CellValue)=>v instanceof Date?v.toISOString().slice(0,10):String(v??"").trim();
const headers={assetCode:["관리번호","assetcode","asset code"],name:["계측기명","계측기","name","instrument"],category:["분류","계측기분류","category"],manufacturer:["제조사","manufacturer"],model:["모델","model"],serialNumber:["제조번호","시리얼번호","serialnumber","serial number"],measurementUnit:["측정 단위","단위","measurementunit","unit"],resolution:["분해능","resolution"],location:["보관 위치","위치","location"],department:["담당 부서","부서","department"],owner:["담당자","관리자","owner"],lastCalibrated:["최근 검교정일","최근 교정일","lastcalibrated"],dueDate:["다음 검교정일","차기 교정일","duedate"]} as const;
export async function POST(request:NextRequest){
  const file=(await request.formData()).get("file");if(!(file instanceof File))return NextResponse.json({error:"Excel 파일을 선택해 주세요."},{status:400});
  const wb=new ExcelJS.Workbook();const excelBytes=Buffer.from(await file.arrayBuffer());await wb.xlsx.load(excelBytes as unknown as Parameters<typeof wb.xlsx.load>[0]);const ws=wb.worksheets[0];if(!ws)return NextResponse.json({error:"워크시트가 없습니다."},{status:400});
  const head=new Map<string,number>();ws.getRow(1).eachCell((cell,col)=>head.set(String(cell.text).trim().toLowerCase(),col));
  const column=(key:keyof typeof headers)=>{for(const alias of headers[key]){const i=head.get(alias.toLowerCase());if(i)return i;}return 0;};
  if(!column("name"))return NextResponse.json({error:"첫 행에 '계측기명' 열이 필요합니다. 제공된 서식을 사용해 주세요."},{status:400});
  const existing=await prisma.instrument.findMany({select:{assetCode:true,barcodeNumber:true}});const codes=new Set(existing.map(x=>x.assetCode));const barcodes=new Set(existing.map(x=>x.barcodeNumber).filter(Boolean) as string[]);
  let assetSeq=existing.length+1;let barcodeSeq=existing.length+1;const year=new Date().getFullYear();const data:Prisma.InstrumentCreateManyInput[]=[];
  for(let rowNo=2;rowNo<=ws.rowCount;rowNo++){
    const row=ws.getRow(rowNo);const get=(key:keyof typeof headers)=>column(key)?normal(row.getCell(column(key)).value):"";const name=get("name");if(!name||name==="예시 계측기")continue;
    let assetCode=get("assetCode");if(!assetCode){do{assetCode=`CAL-ASSET-${year}-${String(assetSeq++).padStart(5,"0")}`}while(codes.has(assetCode));}if(codes.has(assetCode))return NextResponse.json({error:`${rowNo}행 관리번호 ${assetCode}가 이미 등록되어 있습니다.`},{status:409});codes.add(assetCode);
    let barcodeNumber:string;do{barcodeNumber=`CAL-${year}-${String(barcodeSeq++).padStart(5,"0")}`}while(barcodes.has(barcodeNumber));barcodes.add(barcodeNumber);
    const dueRaw=get("dueDate");const lastRaw=get("lastCalibrated");if(!dueRaw||!lastRaw)return NextResponse.json({error:`${rowNo}행의 최근 검교정일과 다음 검교정일을 입력해 주세요.`},{status:400});const dueDate=new Date(dueRaw);const lastCalibrated=new Date(lastRaw);if(Number.isNaN(+dueDate)||Number.isNaN(+lastCalibrated))return NextResponse.json({error:`${rowNo}행 날짜 형식이 올바르지 않습니다. YYYY-MM-DD를 사용해 주세요.`},{status:400});
    data.push({assetCode,barcodeNumber,qrPayload:`CALIBRA:${barcodeNumber}`,name,category:get("category")||"미분류",manufacturer:get("manufacturer")||"미지정",model:get("model")||"미지정",serialNumber:get("serialNumber")||"미등록",measurementUnit:get("measurementUnit")||"mm",resolution:get("resolution"),location:get("location")||"미지정",department:get("department")||"미지정",owner:get("owner")||"미지정",lastCalibrated,dueDate,status:dueDate<new Date()?"만료":dueDate.getTime()<Date.now()+30*86400000?"임박":"정상"});
  }
  if(!data.length)return NextResponse.json({error:"가져올 계측기 행이 없습니다."},{status:400});
  const result=await prisma.instrument.createMany({data});return NextResponse.json({created:result.count});
}
