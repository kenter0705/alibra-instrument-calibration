"use server";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {prisma} from "@/lib/prisma";
import {educationUser} from "@/lib/education-auth";
import {calculateControl,type ControlMode} from "@/lib/spc-control";
import {categoryFrequencies,distributionFrequencies} from "@/lib/spc-frequency";
const normalized=(value:string)=>value.normalize("NFKC").trim().replace(/\.(json|csv|xlsx)$/i,"").replace(/\s+/g," ").toLocaleLowerCase();
export async function deleteSpcInput(id:string){
 await educationUser();
 const item=await prisma.processStudy.findUnique({where:{id},select:{studyNumber:true}});
 if(!item)throw new Error("이미 삭제된 데이터입니다.");
 if(["SPC-2026-001","SPC-2026-002","SPC-2026-003"].includes(item.studyNumber))throw new Error("기본 예시 원본은 삭제할 수 없습니다.");
 await prisma.processStudy.delete({where:{id}});revalidatePath("/quality");
}
function inputDate(value:string,label:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error(label+"을 확인하세요.");const date=new Date(value+"T00:00:00");if(!Number.isFinite(date.getTime()))throw new Error(label+"을 확인하세요.");return date}
export async function saveSpcInput(form:FormData){
 await educationUser();
 const text=(key:string)=>String(form.get(key)||"").trim(),title=text("title"),measurements=String(form.get("measurements")||"");
 if(!title||title.length>150||!measurements.trim()||measurements.length>1000000)throw new Error("분석명과 입력 데이터를 확인하세요.");
 for(const key of ["productName","modelName","partNumber","partName","processName","department","author"])if(!text(key))throw new Error("분석 기본정보를 모두 입력하세요.");
 const sampleCount=Number(form.get("sampleCount")),subgroupSize=Number(form.get("subgroupSize")||1);if(!Number.isInteger(sampleCount)||sampleCount<1||!Number.isInteger(subgroupSize)||subgroupSize<1)throw new Error("시료수와 부분군 크기를 확인하세요.");
 const sourceId=text("sourceStudyId"),sourceTitle=text("sourceTitle");
 if(sourceTitle&&normalized(sourceTitle)===normalized(title))throw new Error("원본과 다른 이름으로 저장하세요.");
 if(sourceId){const original=await prisma.processStudy.findUnique({where:{id:sourceId},select:{title:true}});if(original&&normalized(original.title)===normalized(title))throw new Error("원본과 다른 이름으로 저장하세요.")}
 const controlMode=text("controlMode"),tool=text("tool");if(tool==="6")calculateControl(controlMode as ControlMode,measurements,subgroupSize,text("measurementUnit"));if(tool==="0")(text("checksheetMode")==="distribution"?distributionFrequencies(measurements):categoryFrequencies(measurements));
 const number=(key:string)=>{const value=text(key);if(!value)return null;const parsed=Number(value);if(!Number.isFinite(parsed))throw new Error("규격과 목표값은 숫자로 입력하세요.");return parsed},lowerSpec=number("lowerSpec"),upperSpec=number("upperSpec");if(lowerSpec!==null&&upperSpec!==null&&lowerSpec>=upperSpec)throw new Error("규격 하한은 상한보다 작아야 합니다.");
 const result=await prisma.processStudy.create({data:{studyNumber:"SPC-"+new Date().toISOString().slice(0,10).replaceAll("-","")+"-"+randomUUID().slice(0,8).toUpperCase(),title,companyName:text("companyName"),productName:text("productName"),modelName:text("modelName"),partNumber:text("partNumber"),partName:text("partName"),processName:text("processName"),department:text("department"),author:text("author"),writtenAt:inputDate(text("writtenAt"),"작성일"),measurementDate:inputDate(text("measurementDate"),"측정일자"),equipmentName:text("equipmentName"),instrumentId:text("instrumentId")||null,measurementRange:text("measurementRange"),measurementUnit:text("measurementUnit")||"mm",sampleCount,dataType:text("dataType")||"계량치",chartType:text("chartType")||"관리도",lowerSpec,upperSpec,targetValue:number("targetValue"),subgroupSize,measurements}});
 revalidatePath("/quality");return {id:result.id,studyNumber:result.studyNumber,title:result.title};
}
