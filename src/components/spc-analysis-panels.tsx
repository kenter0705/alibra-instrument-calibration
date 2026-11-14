"use client";
import {useEffect,useState,type ComponentProps} from "react";
import {CapabilityLesson} from "@/components/spc-tool-lesson";
import QualityWorkspace from "@/components/quality-workspace";
import SpcSamplingSheets from "@/components/spc-sampling-sheets";
import SpcDiscreteTool from "@/components/spc-discrete-tool";
import CapabilityAnalysis from "@/components/capability-analysis";
const tools=[["capability","공정능력 Cp·Cpk·Pp·Ppk"],["normal","히스토그램 · 정규분포"],["probability","정규확률도"],["deviation","편차 · Z값"],["binomial","이항분포"],["sampling","샘플링 검사"],["poisson","포아송분포"],["chi","카이제곱분포"],["f","F분포"]] as const;
function ToolSheets({tool,label,instruments}:{tool:string;label:string;instruments:ComponentProps<typeof QualityWorkspace>["instruments"]}){
 const discrete=tool==="binomial"||tool==="sampling"?tool:null;
 const [sheet,setSheet]=useState<"lesson"|"practice">("lesson");
 if(tool==="sampling")return <SpcSamplingSheets/>;
 return <><nav className="spc-page-tabs" role="tablist" aria-label={label+" 학습과 실습"}>{(["lesson","practice"] as const).map((id,index)=><button key={id} type="button" role="tab" id={tool+"-"+id+"-tab"} aria-selected={sheet===id} aria-controls={tool+"-"+id+"-panel"} onClick={()=>setSheet(id)}>{index===0?"①":"②"} {label} · {id==="lesson"?"이론 학습":"실습하기"}</button>)}</nav><div role="tabpanel" id={tool+"-lesson-panel"} aria-labelledby={tool+"-lesson-tab"} hidden={sheet!=="lesson"}>{tool==="capability"&&<CapabilityLesson/>}<p className="standard-note">기존 이론·계산식과 학습용 예시 그래프입니다. 실습 자료와 별도로 유지됩니다.</p>{discrete?<SpcDiscreteTool tool={discrete}/>:<CapabilityAnalysis instruments={instruments} activeTool={tool}/>}</div><div role="tabpanel" id={tool+"-practice-panel"} aria-labelledby={tool+"-practice-tab"} hidden={sheet!=="practice"}>{discrete?<SpcDiscreteTool tool={discrete} practice/>:<CapabilityAnalysis instruments={instruments} activeTool={tool} focusedPractice practiceBlank/>}</div></>;
}
type Category="qc7"|"control"|"distribution"|"sampling";
const categories:[Category,string,string[]][]=[
 ["qc7","QC 7가지 기법",["체크시트 · 유형별 / 분포별","파레토도 · 누적비율","히스토그램 · 정규분포","특성요인도 · 원인 분석","산점도 · 상관관계","층별 · 그룹 비교","관리도 · 아래 전용 분류"]],
 ["control","관리도",["X̄-R · 평균과 범위","X̄-S · 평균과 표준편차","I-MR · 개별값과 이동범위","P · 불량품률","Pn (np) · 불량품 수","C · 결점 수","U · 단위당 결점 수"]],
 ["distribution","분포도",["히스토그램 · 정규분포","정규확률도","편차 · Z값","이항분포","포아송분포","카이제곱분포","F분포","공정능력 · Cp / Cpk / Pp / Ppk"]],
 ["sampling","샘플링 검사와 OC곡선",["① 검사 방법 · 이론 학습","② 1회 계수형 실습 · OC곡선","③ 검사로트 크기 · 검사수량 산정","④ AQL 테이블 · 표본문자 / Ac / Re"]]
];
const routes:Record<Category,string[]>={qc7:['checksheet','pareto','histogram','fishbone','scatter','strata','control'],control:['xbar-r','xbar-s','i-mr','p','np','c','u'],distribution:['normal','probability','deviation','binomial','poisson','chi','f','capability'],sampling:['lesson','practice','lot','aql']};
export default function SpcAnalysisPanels(props:ComponentProps<typeof QualityWorkspace>){
 const [category,setCategory]=useState<Category|null>(null),[tool,setTool]=useState("normal"),[visited,setVisited]=useState<string[]>([]),[samplingVisited,setSamplingVisited]=useState(false);
 const [qcActive,setQcActive]=useState('checksheet'),[controlActive,setControlActive]=useState('xbar-r'),[samplingActive,setSamplingActive]=useState('lesson');
 const [qcRequest,setQcRequest]=useState<{id:string;key:number}>(),[controlRequest,setControlRequest]=useState<{id:string;key:number}>(),[samplingRequest,setSamplingRequest]=useState<{id:'lesson'|'practice'|'lot'|'aql';key:number}>();
 function navigate(id:Category,route:string){if(id==='qc7'&&route==='control'){id='control';route=controlActive}setCategory(id);if(id==='qc7')setQcRequest(previous=>({id:route,key:(previous?.key??0)+1}));if(id==='control')setControlRequest(previous=>({id:route,key:(previous?.key??0)+1}));if(id==='distribution')visit(route);if(id==='sampling'){setSamplingVisited(true);setSamplingRequest(previous=>({id:route as 'lesson'|'practice'|'lot'|'aql',key:(previous?.key??0)+1}))}window.history.replaceState(null,'',window.location.pathname+window.location.search+'#'+(id==='sampling'?'sampling-'+route:route));}
 function visit(id:string){setTool(id);setVisited(current=>current.includes(id)?current:[...current,id]);}
 function selectCategory(id:Category){setCategory(current=>current===id?null:id);if(id==="distribution")visit(tool);if(id==="sampling")setSamplingVisited(true);window.history.replaceState(null,"",window.location.pathname+window.location.search+"#"+(id==="distribution"?tool:id));}
 useEffect(()=>{function sync(){const hash=window.location.hash.slice(1);if(hash.startsWith("sampling-")&&["lesson","practice","lot","aql"].includes(hash.slice(9))){setCategory("sampling");setSamplingVisited(true);setSamplingRequest(previous=>({id:hash.slice(9) as "lesson"|"practice"|"lot"|"aql",key:(previous?.key??0)+1}))}else if(hash==="sampling"){setCategory("sampling");setSamplingVisited(true)}else if(hash==="distribution"||tools.some(([id])=>id===hash&&id!=="sampling")){setCategory("distribution");visit(hash==="distribution"?"normal":hash)}else if(["control","report","xbar-r","xbar-s","i-mr","p","np","c","u"].includes(hash)){setCategory("control");if(routes.control.includes(hash))setControlRequest(previous=>({id:hash,key:(previous?.key??0)+1}))}else if(routes.qc7.includes(hash)){setCategory("qc7");setQcRequest(previous=>({id:hash,key:(previous?.key??0)+1}))}else if(["qc7","relationship"].includes(hash))setCategory("qc7")}sync();window.addEventListener("hashchange",sync);return()=>window.removeEventListener("hashchange",sync)},[]);
 return <div id="qc7" className="spc-category-accordion" aria-label="통계적 공정관리 분류">
 {categories.map(([id,label,description])=><section key={id} className="spc-category" data-category={id}>
 <div className="spc-category-header" data-open={category===id}><h2 className="spc-category-title"><button type="button" aria-expanded={category===id} aria-controls={"spc-category-"+id} onClick={()=>selectCategory(id)}><span className="spc-category-name">{label}</span><span className="spc-category-arrow" aria-hidden="true">⌄</span></button></h2><nav className="spc-category-inventory" aria-label={label+' 도구 바로가기'}>{description.map((name,index)=>{const route=routes[id][index],active=category===id&&(id==='qc7'?qcActive:id==='control'?controlActive:id==='distribution'?tool:samplingActive)===route&&(id!=='sampling'||index!==4);return <button type="button" key={name} aria-pressed={active} aria-current={active?'page':undefined} onClick={()=>navigate(id,route)}>{name}</button>})}</nav></div>
 <div id={"spc-category-"+id} className="spc-category-body" data-open={category===id} aria-hidden={category!==id}><div className="spc-category-inner" inert={category!==id}><div className="spc-category-content">
 {id==="qc7"&&<><QualityWorkspace {...props} scope="qc7" navigationRequest={qcRequest} onActiveToolChange={setQcActive}/><p><button type="button" className="secondary-button spc-category-jump" onClick={()=>selectCategory("control")}>관리도 기법 · 종류별 내용 펼치기 →</button></p></>}
 {id==="control"&&<QualityWorkspace {...props} scope="control" navigationRequest={controlRequest} onActiveToolChange={setControlActive}/>}
 {id==="distribution"&&<div id="capability"><nav className="spc-distribution-tools" aria-label="분포도 도구 선택">{tools.filter(([id])=>id!=="sampling").map(([id,label])=><button type="button" key={id} aria-pressed={tool===id} onClick={()=>{visit(id);window.history.replaceState(null,"",window.location.pathname+window.location.search+"#"+id)}}>{label}</button>)}</nav>{tools.filter(([id])=>id!=="sampling"&&visited.includes(id)).map(([id,label])=><div key={id} hidden={tool!==id}><ToolSheets tool={id} label={label} instruments={props.instruments}/></div>)}</div>}
 {id==="sampling"&&samplingVisited&&<SpcSamplingSheets navigationRequest={samplingRequest} onActiveTabChange={setSamplingActive}/>}
 </div></div></div></section>)}
 </div>;
}
