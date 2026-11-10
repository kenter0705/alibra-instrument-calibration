"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export async function saveProcedure(form:FormData){
  const id=String(form.get("id")||"");
  const data={documentNumber:String(form.get("documentNumber")||"").trim(),title:String(form.get("title")||"").trim(),instrumentCategory:String(form.get("instrumentCategory")||"").trim(),calibrationRoute:String(form.get("calibrationRoute")||"자체 검교정"),targetInstruments:String(form.get("targetInstruments")||""),standardReference:String(form.get("standardReference")||"ISO 10012:2026 / ISO/IEC 17025:2017"),purpose:String(form.get("purpose")||""),scope:String(form.get("scope")||""),equipment:String(form.get("equipment")||""),environment:String(form.get("environment")||""),method:String(form.get("method")||""),acceptanceCriteria:String(form.get("acceptanceCriteria")||""),uncertainty:String(form.get("uncertainty")||""),safety:String(form.get("safety")||""),steps:String(form.get("steps")||""),revision:String(form.get("revision")||"Rev.0"),status:String(form.get("status")||"작성 중")};
  if(!data.documentNumber||!data.title||!data.instrumentCategory||!data.targetInstruments)throw new Error("문서번호, 제목, 분류, 적용 대상은 필수입니다.");
  if(id)await prisma.calibrationProcedure.update({where:{id},data});else await prisma.calibrationProcedure.create({data});
  revalidatePath("/procedures");
}
export async function deleteProcedure(form:FormData){const id=String(form.get("id")||"");if(id)await prisma.calibrationProcedure.delete({where:{id}});revalidatePath("/procedures");}

export async function saveTargetType(_previous:{message:string;success:boolean},form:FormData):Promise<{message:string;success:boolean}>{
 try {
  const id=String(form.get("id")||"");
  const data={code:String(form.get("code")||"").trim(),name:String(form.get("name")||"").trim(),category:String(form.get("category")||"").trim(),measurementUnit:String(form.get("measurementUnit")||"").trim(),calibrationRoute:String(form.get("calibrationRoute")||"검토 필요"),defaultIntervalMonths:form.get("defaultIntervalMonths")?Number(form.get("defaultIntervalMonths")):null,selfCalibrationEligible:form.get("selfCalibrationEligible")==="true",guidance:String(form.get("guidance")||"").trim()};
  if(!data.code||!data.name||!data.category||!data.measurementUnit||!data.guidance)throw new Error("코드, 대상명, 분류, 단위, 적용 안내를 입력해 주세요.");
  if(data.defaultIntervalMonths!==null&&(!Number.isInteger(data.defaultIntervalMonths)||data.defaultIntervalMonths<1))throw new Error("검교정 주기는 1개월 이상의 정수로 입력해 주세요.");
  if(id)await prisma.calibrationTargetType.update({where:{id},data});else await prisma.calibrationTargetType.create({data});
  revalidatePath("/procedures");
  return {message:id?"대상 정보가 저장되었습니다.":"자체 검교정 대상이 등록되었습니다.",success:true};
 } catch(error) {
  return {message:error instanceof Error?error.message:"저장에 실패했습니다. 입력값과 데이터베이스 연결을 확인해 주세요.",success:false};
 }
}
export async function deleteTargetType(form:FormData){const id=String(form.get("id")||"");if(id)await prisma.calibrationTargetType.delete({where:{id}});revalidatePath("/procedures");}

export async function saveIssue(form:FormData){
  const id=String(form.get("id")||"");const date=(key:string)=>form.get(key)?new Date(`${String(form.get(key))}T00:00:00`):null;
  const instrumentId=String(form.get("instrumentId")||"");const issuedTo=String(form.get("issuedTo")||"").trim();const returnDepartment=String(form.get("returnDepartment")||"").trim();const returnResponsible=String(form.get("returnResponsible")||"").trim();
  if(!instrumentId||!issuedTo||!returnDepartment||!returnResponsible||!date("issuedAt"))throw new Error("계측기, 사용자, 불출일, 반납부서, 반납 담당자를 입력해 주세요.");
  const data={instrumentId,issuedTo,issuedBy:String(form.get("issuedBy")||"관리자"),issuedAt:date("issuedAt")!,dueBackAt:date("dueBackAt"),returnDepartment,returnResponsible,returnedAt:date("returnedAt"),purpose:String(form.get("purpose")||""),locationOut:String(form.get("locationOut")||""),conditionOut:String(form.get("conditionOut")||"양호"),conditionIn:String(form.get("conditionIn")||"")||null,status:String(form.get("status")||"불출 중")};
  if(id)await prisma.issueTransaction.update({where:{id},data});else await prisma.issueTransaction.create({data:{...data,transactionNo:`ISS-${Date.now()}`}});
  revalidatePath("/issues");revalidatePath("/");revalidatePath("/calendar");if(form.get("popupCreate")==="1")redirect("/issues/new?saved=1");
}
export async function deleteIssue(form:FormData){const id=String(form.get("id")||"");if(id)await prisma.issueTransaction.delete({where:{id}});revalidatePath("/issues");revalidatePath("/");revalidatePath("/calendar");}

export async function saveTrainingCourse(form:FormData){
  const id=String(form.get("id")||"");const courseCode=String(form.get("courseCode")||"").trim();const trainingDate=String(form.get("trainingDate")||"");
  const data={courseCode,title:String(form.get("title")||"").trim(),organizerDepartment:String(form.get("organizerDepartment")||"").trim(),educationManager:String(form.get("educationManager")||"").trim(),subject:String(form.get("subject")||""),trainingReport:String(form.get("trainingReport")||""),audience:String(form.get("audience")||""),instructor:String(form.get("instructor")||""),durationHours:Number(form.get("durationHours")||0),trainingDate:new Date(`${trainingDate}T00:00:00`),validityMonths:Number(form.get("validityMonths")||12),materialPath:String(form.get("materialPath")||"")||null};
  if(!data.courseCode||!data.title||!data.organizerDepartment||!data.educationManager||!trainingDate||!Number.isFinite(data.durationHours)||data.durationHours<=0)throw new Error("교육 코드, 교육명, 주관부서, 담당자, 일정, 교육시간을 입력해 주세요.");
  if(id)await prisma.trainingCourse.update({where:{id},data});else await prisma.trainingCourse.create({data});revalidatePath("/training");
}
export async function deleteTrainingCourse(form:FormData){const id=String(form.get("id")||"");if(id)await prisma.trainingCourse.delete({where:{id}});revalidatePath("/training");}
export async function saveTrainingRecord(form:FormData){
  const id=String(form.get("id")||"");const courseId=String(form.get("courseId")||"");const completedAt=new Date(`${String(form.get("completedAt")||"")}T00:00:00`);const validity=Number(form.get("validityMonths")||12);const expiresAt=new Date(completedAt);expiresAt.setMonth(expiresAt.getMonth()+validity);
  const data={courseId,employeeName:String(form.get("employeeName")||"").trim(),department:String(form.get("department")||"").trim(),result:String(form.get("result")||"참석"),score:form.get("score")?Number(form.get("score")):null,completedAt,expiresAt,evidencePath:String(form.get("evidencePath")||"")};
  if(!courseId||!data.employeeName||!data.department||Number.isNaN(completedAt.getTime()))throw new Error("교육 과정, 참석자, 부서, 참석일을 입력해 주세요.");
  if(id)await prisma.trainingRecord.update({where:{id},data});else await prisma.trainingRecord.create({data});revalidatePath("/training");
}
export async function deleteTrainingRecord(form:FormData){const id=String(form.get("id")||"");if(id)await prisma.trainingRecord.delete({where:{id}});revalidatePath("/training");}

export async function saveProcessQualification(form:FormData){
  const id=String(form.get("id")||"");const assessmentDate=String(form.get("assessmentDate")||"");const validUntil=String(form.get("validUntil")||"");
  const operatorNames=Array.from({length:5},(_,i)=>String(form.get(`operatorName${i+1}`)||"").trim());const experiences=Array.from({length:5},(_,i)=>form.get(`operatorExperienceYears${i+1}`)?Number(form.get(`operatorExperienceYears${i+1}`)):null);
  const sheetRows=[] as {sample:number;actual:string;results:string[]}[];for(let sample=1;sample<=5;sample++){const actual=String(form.get(`sampleActual_${sample}`)||"");const results=Array.from({length:5},(_,i)=>String(form.get(`operatorResult_${sample}_${i+1}`)||""));if(actual!=="양품"&&actual!=="불량")throw new Error("검출력 시트 5개 시료의 기준 판정을 모두 입력해 주세요.");if(results.some((value,i)=>operatorNames[i]? !/^\d{10}$/.test(value):Boolean(value)&&!/^\d{10}$/.test(value)))throw new Error("등록한 작업자 판정은 0/1 숫자 10자리로 입력해 주세요. 0=양품 판정, 1=불량 판정입니다.");sheetRows.push({sample,actual,results})}
  const upload=form.get("certificate"),certificateDir=path.join(process.cwd(),"public","qualification-certificates");let certificatePath:string|undefined,certificateFileName:string|undefined;
  if(upload instanceof File&&upload.size){const ext=path.extname(upload.name).toLowerCase();if(![".pdf",".png",".jpg",".jpeg"].includes(ext))throw new Error("자격인정서는 PDF, PNG, JPG 파일로 등록해 주세요.");if(upload.size>20*1024*1024)throw new Error("자격인정서 파일은 20MB 이하로 등록해 주세요.");await mkdir(certificateDir,{recursive:true});certificatePath="/qualification-certificates/"+randomUUID()+ext;certificateFileName=path.basename(upload.name);await writeFile(path.join(certificateDir,path.basename(certificatePath)),Buffer.from(await upload.arrayBuffer()))}
  const previous=id?await prisma.processQualification.findUnique({where:{id},select:{certificatePath:true}}):null;
  const sampleCount=50,defects=sheetRows.filter(r=>r.actual==="불량").length*10;const counts=Array.from({length:5},(_,operator)=>sheetRows.reduce((sum,row)=>sum+(row.actual==="불량"?row.results[operator].split("").filter(x=>x==="1").length:0),0));const missed=Array.from({length:5},(_,operator)=>sheetRows.reduce((sum,row)=>sum+(row.actual==="불량"?row.results[operator].split("").filter(x=>x==="0").length:0),0));const falseAlarms=Array.from({length:5},(_,operator)=>sheetRows.reduce((sum,row)=>sum+(row.actual==="양품"?row.results[operator].split("").filter(x=>x==="1").length:0),0));
  const data={qualificationNo:String(form.get("qualificationNo")||"").trim(),processName:String(form.get("processName")||"").trim(),productionItem:String(form.get("productionItem")||"").trim(),operatorName:operatorNames[0],operatorName2:operatorNames[1],operatorName3:operatorNames[2],operatorName4:operatorNames[3],operatorName5:operatorNames[4],operatorExperienceYears:experiences[0],operatorExperienceYears2:experiences[1],operatorExperienceYears3:experiences[2],operatorExperienceYears4:experiences[3],operatorExperienceYears5:experiences[4],department:String(form.get("department")||"").trim(),specialCharacteristic:String(form.get("specialCharacteristic")||"").trim(),characteristicType:String(form.get("characteristicType")||"치수"),assessmentDate:new Date(`${assessmentDate}T00:00:00`),validUntil:validUntil?new Date(`${validUntil}T00:00:00`):null,requirement:String(form.get("requirement")||""),acceptanceCriteria:String(form.get("acceptanceCriteria")||""),detectionMethod:String(form.get("detectionMethod")||""),detectionSampleCount:sampleCount,detectionDefects:defects,detectionCorrect:counts.reduce((a,b)=>a+b,0),detectionMissed:missed.reduce((a,b)=>a+b,0),detectionFalseAlarm:falseAlarms.reduce((a,b)=>a+b,0),detectionSheetData:JSON.stringify(sheetRows),method:String(form.get("method")||""),owner:String(form.get("owner")||"").trim(),status:String(form.get("status")||"검토 중"),grrStudyId:String(form.get("grrStudyId")||"")||null,instrumentId:String(form.get("instrumentId")||"")||null,evidence:String(form.get("evidence")||""),notes:String(form.get("notes")||""),...(certificatePath?{certificatePath,certificateFileName}: {})};
  if(!data.qualificationNo||!data.processName||!data.productionItem||!operatorNames[0]||!data.department||!data.specialCharacteristic||!assessmentDate||!data.requirement||!data.acceptanceCriteria||!data.method||!data.owner)throw new Error("부서, 특성, 공정, 생산품목, 작업자 1, 관리번호, 요구사항과 판정기준을 입력해 주세요.");
  if(experiences.some(x=>x!==null&&(!Number.isInteger(x)||x<0)))throw new Error("작업 경력은 0 이상의 정수로 입력해 주세요.");
  if(id)await prisma.processQualification.update({where:{id},data});else await prisma.processQualification.create({data});
  if(certificatePath&&previous?.certificatePath?.startsWith("/qualification-certificates/"))await unlink(path.join(certificateDir,path.basename(previous.certificatePath))).catch(()=>{});
  revalidatePath("/special-process");if(form.get("popupCreate")==="1")redirect("/special-process?new=1&saved=1");
}
export async function deleteProcessQualification(form:FormData){const id=String(form.get("id")||"");if(id)await prisma.processQualification.delete({where:{id}});revalidatePath("/special-process");}

export async function saveProcessStudy(form:FormData){
  const id=String(form.get("id")||"");const title=String(form.get("title")||"").trim();const dataType=String(form.get("dataType")||"계량치");const chartType=String(form.get("chartType")||"I 관리도");const raw=String(form.get("measurements")||"").trim();
  const productName=String(form.get("productName")||"").trim(),modelName=String(form.get("modelName")||"").trim(),partNumber=String(form.get("partNumber")||"").trim(),partName=String(form.get("partName")||"").trim(),processName=String(form.get("processName")||"").trim(),department=String(form.get("department")||"").trim(),author=String(form.get("author")||"").trim(),writtenAt=String(form.get("writtenAt")||""),measurementDate=String(form.get("measurementDate")||"");
  const sampleCount=Number(form.get("sampleCount")||0);if(!title||!raw||!productName||!modelName||!partNumber||!partName||!processName||!department||!author||!writtenAt||!measurementDate||sampleCount<1)throw new Error("분석 기본정보, 측정일자, 작성자·작성일과 시료수를 입력해 주세요.");
  const data={title,companyName:String(form.get("companyName")||"").trim(),productName,modelName,partNumber,partName,processName,department,author,writtenAt:new Date(`${writtenAt}T00:00:00`),measurementDate:new Date(`${measurementDate}T00:00:00`),equipmentName:String(form.get("equipmentName")||"").trim(),instrumentId:String(form.get("instrumentId")||"")||null,measurementRange:String(form.get("measurementRange")||"").trim(),measurementUnit:String(form.get("measurementUnit")||"mm"),sampleCount,dataType,chartType,lowerSpec:form.get("lowerSpec")?Number(form.get("lowerSpec")):null,upperSpec:form.get("upperSpec")?Number(form.get("upperSpec")):null,targetValue:form.get("targetValue")?Number(form.get("targetValue")):null,subgroupSize:Number(form.get("subgroupSize")||1),measurements:raw};
  if(id)await prisma.processStudy.update({where:{id},data});else await prisma.processStudy.create({data:{...data,studyNumber:`SPC-${Date.now()}`}});revalidatePath("/quality");
}
export async function deleteProcessStudy(form:FormData){const id=String(form.get("id")||"");if(id)await prisma.processStudy.delete({where:{id}});revalidatePath("/quality");}

export async function savePurchase(form:FormData){const id=String(form.get("id")||"");const requestedAt=form.get("requestedAt")?new Date(`${String(form.get("requestedAt"))}T00:00:00`):new Date();const data={itemName:String(form.get("itemName")||"").trim(),category:String(form.get("category")||"").trim(),quantity:Number(form.get("quantity")||1),requestedBy:String(form.get("requestedBy")||"").trim(),department:String(form.get("department")||"").trim(),reason:String(form.get("reason")||"").trim(),estimatedCost:form.get("estimatedCost")?Number(form.get("estimatedCost")):null,approvedCost:form.get("approvedCost")?Number(form.get("approvedCost")):null,actualCost:form.get("actualCost")?Number(form.get("actualCost")):null,status:String(form.get("status")||"작성 중"),requestedAt,receivedAt:form.get("receivedAt")?new Date(`${String(form.get("receivedAt"))}T00:00:00`):null};if(!data.itemName||!data.category||!data.requestedBy||!data.department||!data.reason||data.quantity<1)throw new Error("품목, 분류, 요청자, 부서, 구매사유를 입력해 주세요.");if(id)await prisma.purchaseRequest.update({where:{id},data});else await prisma.purchaseRequest.create({data:{...data,requestNumber:`PUR-${Date.now()}`}});revalidatePath("/purchases");revalidatePath("/costs");if(form.get("popupCreate")==="1")redirect("/purchases/new?saved=1");if(form.get("popupEdit")==="1"&&id)redirect(`/purchases/${id}?saved=1`);}
export async function deletePurchase(form:FormData){const id=String(form.get("id")||"");if(id)await prisma.purchaseRequest.delete({where:{id}});revalidatePath("/purchases");revalidatePath("/costs");}
export async function saveDisposal(form:FormData){const id=String(form.get("id")||"");const instrumentId=String(form.get("instrumentId")||"");const disposedAt=form.get("disposedAt")?new Date(`${String(form.get("disposedAt"))}T00:00:00`):new Date();const status=String(form.get("status")||"신청");const data={instrumentId,disposedAt,reason:String(form.get("reason")||"").trim(),approvedBy:String(form.get("approvedBy")||"").trim(),method:String(form.get("method")||"").trim(),bookValue:form.get("bookValue")?Number(form.get("bookValue")):null,salvageValue:form.get("salvageValue")?Number(form.get("salvageValue")):null,disposalCost:form.get("disposalCost")?Number(form.get("disposalCost")):null,department:String(form.get("department")||"").trim(),status};if(!instrumentId||!data.reason||!data.approvedBy||!data.method||!data.department)throw new Error("계측기, 폐기 사유·방법, 담당자와 부서를 입력해 주세요.");const disposalNumber=String(form.get("disposalNumber")||"")||`DSP-${Date.now()}`;if(id)await prisma.disposalRecord.update({where:{id},data:{...data,disposalNumber}});else await prisma.disposalRecord.create({data:{...data,disposalNumber}});if(status==="폐기 완료")await prisma.instrument.update({where:{id:instrumentId},data:{status:"폐기"}});revalidatePath("/disposals");revalidatePath("/instruments");revalidatePath("/costs");if(form.get("popupCreate")==="1")redirect("/disposals/new?saved=1");}
export async function deleteDisposal(form:FormData){const id=String(form.get("id")||"");if(id)await prisma.disposalRecord.delete({where:{id}});revalidatePath("/disposals");revalidatePath("/costs");}

export async function saveProvider(form:FormData){
  const id=String(form.get("id")||"");
  const data={name:String(form.get("name")||"").trim(),accreditationNumber:String(form.get("accreditationNumber")||"").trim(),scope:String(form.get("scope")||""),contactName:String(form.get("contactName")||""),phone:String(form.get("phone")||""),email:String(form.get("email")||""),address:String(form.get("address")||""),status:String(form.get("status")||"확인 필요"),certificateExpiry:form.get("certificateExpiry")?new Date(String(form.get("certificateExpiry"))):null,sourceUrl:form.get("sourceUrl")?String(form.get("sourceUrl")):null,verifiedAt:form.get("verifiedAt")?new Date(String(form.get("verifiedAt"))):null};
  if(!data.name)throw new Error("업체명을 입력해 주세요.");
  if(id)await prisma.calibrationProvider.update({where:{id},data});else await prisma.calibrationProvider.create({data});
  revalidatePath("/providers");
}
export async function deleteProvider(form:FormData){const id=String(form.get("id")||"");if(id)await prisma.calibrationProvider.delete({where:{id}});revalidatePath("/providers");}

const trainingMaterialDir=path.join(process.cwd(),"public","training","materials");
const trainingMaterialTypes:Record<string,string>={".pdf":"PDF",".ppt":"PPT",".pptx":"PPTX"};
function youtubeEmbedUrl(input:string){try{const url=new URL(input.trim());const id=url.hostname==="youtu.be"?url.pathname.slice(1):url.searchParams.get("v")||url.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1]||"";if(!["youtube.com","www.youtube.com","m.youtube.com","music.youtube.com","youtu.be","www.youtu.be"].includes(url.hostname)||!/^[-\w]{11}$/.test(id))return null;return "https://www.youtube-nocookie.com/embed/"+id}catch{return null}}
async function nextTrainingMaterialNo(){const year=new Date().getFullYear(),prefix="TM-"+year+"-",items=await prisma.trainingMaterial.findMany({where:{materialNo:{startsWith:prefix}},select:{materialNo:true}});const max=items.reduce((n,x)=>Math.max(n,Number(x.materialNo.slice(prefix.length))||0),0);return prefix+String(max+1).padStart(4,"0")}
export async function saveTrainingMaterial(form:FormData){
  const title=String(form.get("title")||"").trim(),description=String(form.get("description")||"").trim(),educationPurpose=String(form.get("educationPurpose")||"").trim(),learningContent=String(form.get("learningContent")||"").trim(),contentSummary=String(form.get("contentSummary")||"").trim(),upload=form.get("file"),rawVideoUrl=String(form.get("videoUrl")||"").trim();
  if(!title)throw new Error("교재 제목을 입력해 주세요.");
  if(rawVideoUrl){if(upload instanceof File&&upload.size)throw new Error("파일 업로드 또는 YouTube URL 중 한 가지를 선택해 주세요.");const videoUrl=youtubeEmbedUrl(rawVideoUrl);if(!videoUrl)throw new Error("YouTube 영상 주소를 확인해 주세요. 일반 영상, 공유, Shorts 주소를 사용할 수 있습니다.");await prisma.trainingMaterial.create({data:{materialNo:await nextTrainingMaterialNo(),title,description,educationPurpose,learningContent,contentSummary,fileName:"YouTube 동영상",filePath:rawVideoUrl,fileType:"YOUTUBE",fileSize:0,videoUrl}});revalidatePath("/training/materials");if(form.get("popupCreate")==="1")redirect("/training/materials/new?saved=1");return}
  if(!(upload instanceof File)||upload.size===0)throw new Error("PDF/PPT 파일 또는 YouTube URL을 입력해 주세요.");
  if(upload.size>50*1024*1024)throw new Error("파일 크기는 50MB 이하로 등록해 주세요.");
  const ext=path.extname(upload.name).toLowerCase(),fileType=trainingMaterialTypes[ext];
  if(!fileType)throw new Error("PDF, PPT, PPTX 파일만 등록할 수 있습니다.");
  await mkdir(trainingMaterialDir,{recursive:true});
  const filePath="/training/materials/"+randomUUID()+ext;
  await writeFile(path.join(trainingMaterialDir,path.basename(filePath)),Buffer.from(await upload.arrayBuffer()));
  try{await prisma.trainingMaterial.create({data:{materialNo:await nextTrainingMaterialNo(),title,description,educationPurpose,learningContent,contentSummary,fileName:path.basename(upload.name),filePath,fileType,fileSize:upload.size}})}catch(error){await unlink(path.join(trainingMaterialDir,path.basename(filePath))).catch(()=>{});throw error}
  revalidatePath("/training/materials");if(form.get("popupCreate")==="1")redirect("/training/materials/new?saved=1");
}
export async function updateTrainingMaterial(form:FormData){const id=String(form.get("id")||""),title=String(form.get("title")||"").trim(),description=String(form.get("description")||"").trim(),educationPurpose=String(form.get("educationPurpose")||"").trim(),learningContent=String(form.get("learningContent")||"").trim(),contentSummary=String(form.get("contentSummary")||"").trim(),rawVideoUrl=String(form.get("videoUrl")||"").trim();if(!id||!title)throw new Error("교재 제목이 필요합니다.");const data:{title:string;description:string;educationPurpose:string;learningContent:string;contentSummary:string;fileName?:string;filePath?:string;fileType?:string;fileSize?:number;videoUrl?:string|null}={title,description,educationPurpose,learningContent,contentSummary};if(rawVideoUrl){const videoUrl=youtubeEmbedUrl(rawVideoUrl);if(!videoUrl)throw new Error("YouTube 영상 주소를 확인해 주세요.");data.fileName="YouTube 동영상";data.filePath=rawVideoUrl;data.fileType="YOUTUBE";data.fileSize=0;data.videoUrl=videoUrl}await prisma.trainingMaterial.update({where:{id},data});revalidatePath("/training/materials");revalidatePath(`/training/materials/${id}/edit`);if(form.get("popupEdit")==="1")redirect(`/training/materials/${id}/edit?saved=1`);}
export async function deleteTrainingMaterial(form:FormData){const id=String(form.get("id")||"");if(!id)return;const material=await prisma.trainingMaterial.findUnique({where:{id}});if(!material)return;await prisma.trainingMaterial.delete({where:{id}});if(material.filePath.startsWith("/training/materials/")){await unlink(path.join(trainingMaterialDir,path.basename(material.filePath))).catch(()=>{})}revalidatePath("/training/materials");}

