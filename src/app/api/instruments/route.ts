import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { kolasCalibrationCatalog } from "@/lib/kolas-calibration-catalog";
import { addCalibrationMonths, parseCalibrationDate } from "@/lib/calibration-dates";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const required = ["name","category","manufacturer","model","serialNumber","location","department","owner","lastCalibrated","calibrationIntervalMonths"] as const;
  if (required.some(key => !String(body[key] ?? "").trim())) return NextResponse.json({error:"필수 항목을 모두 입력해 주세요."},{status:400});
  const year = new Date().getFullYear();
  const existingCodes=new Set((await prisma.instrument.findMany({select:{assetCode:true}})).map(x=>x.assetCode));
  let assetSequence=existingCodes.size+1;let assetCode=String(body.assetCode??"").trim();
  if(!assetCode){do{assetCode=`CAL-ASSET-${year}-${String(assetSequence++).padStart(5,"0")}`}while(existingCodes.has(assetCode));}
  if(existingCodes.has(assetCode))return NextResponse.json({error:`관리번호 ${assetCode}가 이미 등록되어 있습니다.`},{status:409});
  let sequence = (await prisma.instrument.count()) + 1;
  let barcodeNumber = `CAL-${year}-${String(sequence).padStart(5,"0")}`;
  while (await prisma.instrument.findUnique({where:{barcodeNumber}})) {
    sequence++;
    barcodeNumber = `CAL-${year}-${String(sequence).padStart(5,"0")}`;
  }
  const lastCalibratedValue=String(body.lastCalibrated);const lastCalibrated=parseCalibrationDate(lastCalibratedValue);const catalogItem=kolasCalibrationCatalog.find(item=>item.code===String(body.catalogCode??""));const interval=catalogItem?.months??Number(body.calibrationIntervalMonths);if(!lastCalibrated||!Number.isInteger(interval)||interval<1||interval>1200)return NextResponse.json({error:"검교정일과 검교정 주기를 확인해 주세요."},{status:400});const due=addCalibrationMonths(lastCalibratedValue,interval);if(!due)return NextResponse.json({error:"차기 검교정일을 계산하지 못했습니다."},{status:400});
  const instrument = await prisma.instrument.create({data:{
    assetCode, barcodeNumber, qrPayload:`CALIBRA:${barcodeNumber}`,
    name:String(body.name).trim(), category:catalogItem?`${catalogItem.group} · ${catalogItem.label} (${catalogItem.code})`:String(body.category).trim(), manufacturer:String(body.manufacturer).trim(),
    model:String(body.model).trim(), serialNumber:String(body.serialNumber).trim(), location:String(body.location).trim(),
    department:String(body.department).trim(), owner:String(body.owner).trim(), lastCalibrated,
    purchaseSource:String(body.purchaseSource??""),purchaseDate:body.purchaseDate?new Date(body.purchaseDate):null,purchaseCost:body.purchaseCost?Number(body.purchaseCost):null,
    usagePurpose:String(body.usagePurpose??""),measurementRange:String(body.measurementRange??""),measurementUnit:String(body.measurementUnit??"mm").trim()||"mm",resolution:String(body.resolution??""),accuracy:String(body.accuracy??""),specification:String(body.specification??""),
    calibrationIntervalMonths:interval,storageCondition:String(body.storageCondition??""),
    dueDate:due, status:due < new Date() ? "만료" : due.getTime() < Date.now()+30*86400000 ? "임박" : "정상",
  }});
  return NextResponse.json(instrument,{status:201});
}
