import { prisma } from "@/lib/prisma";
import CalibrationRecordForm from "@/components/calibration-record-form";
import BoardPopupActions from "@/components/board-popup-actions";
export const dynamic="force-dynamic";
export default async function NewCalibrationPage({searchParams}:{searchParams:Promise<{instrument?:string;year?:string;route?:string}>}){
 const query=await searchParams;const [instruments,providers,procedures]=await Promise.all([prisma.instrument.findMany({where:{status:{notIn:["폐기","분실"]}},select:{id:true,name:true,assetCode:true,category:true,calibrationIntervalMonths:true},orderBy:{assetCode:"asc"}}),prisma.calibrationProvider.findMany({select:{id:true,name:true},orderBy:{name:"asc"}}),prisma.calibrationProcedure.findMany({select:{id:true,title:true},orderBy:{title:"asc"}})]);
 const back=`/calibrations?year=${Number(query.year)||new Date().getFullYear()}${query.route==="external"?"&route=external":""}${query.instrument?`&instrument=${query.instrument}`:""}`;
 return <main className="record-page"><header className="record-top"><BoardPopupActions listHref={back} listLabel="목록가기"/></header><section className="record-content"><div className="page-heading"><div><span className="eyebrow">CALIBRATION HISTORY · NEW</span><h1>검교정 이력 등록</h1><p>계측기를 선택하면 대장에 등록된 분류와 검교정 주기를 불러오고, 검교정일 기준으로 차기일을 계산합니다.</p></div></div><section className="panel calibration-editor-panel"><CalibrationRecordForm instruments={instruments} providers={providers} procedures={procedures.map(p=>({id:p.id,name:p.title}))} preselected={query.instrument}/></section></section></main>
}
