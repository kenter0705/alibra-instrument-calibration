"use client";
import { calculateControl, controlModes, type ControlMode, type ControlPlot } from "@/lib/spc-control";
import React, {useState} from "react";
import {controlSignals} from "@/lib/spc-rules";
import SpcJudgementGuide from "@/components/spc-judgement-guide";

export function ControlSelector({mode,onChange}:{mode:string;onChange:(mode:ControlMode)=>void}){
 return <section className="spc-control-selector" aria-label="관리도 종류 선택"><h3>관리도 종류</h3><div>{controlModes.map(item=><button type="button" key={item.id} aria-pressed={mode===item.id} onClick={()=>onChange(item.id)}><strong>{item.name}</strong><small>{item.input}</small></button>)}</div><p>{controlModes.find(m=>m.id===mode)?.condition} <a href="/spc-reference">SPC 용어·계산식·6시그마 안내</a></p></section>;
}
const number=(n:number)=>Number.isFinite(n)?Number(n.toPrecision(6)).toLocaleString("ko-KR",{maximumFractionDigits:6}):"계산 불가";
function Plot({plot,signals}:{plot:ControlPlot;signals:string[][]}){
 const {points}=plot;let low=Math.min(...points.map(p=>Math.min(p.value,p.lower))),high=Math.max(...points.map(p=>Math.max(p.value,p.upper)));const pad=Math.max((high-low)*.12,Math.abs(high)*.005,.001);low=low>=0?Math.max(0,low-pad):low-pad;high+=pad;
 const x=(i:number)=>90+i*640/Math.max(1,points.length-1),y=(v:number)=>265-(v-low)/(high-low)*220,percent=plot.unit==="%",format=(v:number)=>number(percent?v*100:v)+(percent?"%":"");
 const labelYs=[points.at(-1)!.upper,points.at(-1)!.center,points.at(-1)!.lower].reduce<number[]>((a,v)=>[...a,Math.max(y(v)+4,(a.at(-1)??-1000)+16)],[]);const labelOverflow=Math.max(0,labelYs[2]-280);
 const path=(key:"value"|"center"|"upper"|"lower")=>points.map((p,i)=>`${x(i)},${y(p[key])}`).join(" ");
 return <section className="spc-control-plot"><h3>{plot.title}</h3><svg viewBox="0 0 900 330" role="img" aria-label={plot.title+" · 빨강 UCL·LCL, 초록 CL, 파랑 측정값"}>
  {Array.from({length:5},(_,i)=>{const v=low+(high-low)*i/4;return <g key={i}><line x1="90" x2="730" y1={y(v)} y2={y(v)} stroke="#e4e9ef"/><text x="80" y={y(v)+4} textAnchor="end">{format(v)}</text></g>})}
  <line x1="90" y1="45" x2="90" y2="265" stroke="#8899aa"/><line x1="90" y1="265" x2="730" y2="265" stroke="#8899aa"/>
  <polyline points={path("upper")} fill="none" stroke="#c63535" strokeWidth="1.8"/><polyline points={path("center")} fill="none" stroke="#23854a" strokeWidth="1.8"/><polyline points={path("lower")} fill="none" stroke="#c63535" strokeWidth="1.8"/>
  <polyline points={path("value")} fill="none" stroke="#234c87" strokeWidth="2"/>
  {points.map((p,i)=><g key={p.index}>{(i===0||i===points.length-1||i%Math.ceil(points.length/12)===0)&&<text x={x(i)} y="287" textAnchor="middle">{p.index}</text>}<circle cx={x(i)} cy={y(p.value)} r={signals[i].length?4.5:3.2} fill={signals[i].length?"#c63535":"#234c87"}><title>{`${p.index}번: ${format(p.value)} · UCL ${format(p.upper)} · CL ${format(p.center)} · LCL ${format(p.lower)} · ${signals[i].join(", ")||"선택 기준 신호 없음"}`}</title></circle></g>)}
  {(["upper","center","lower"] as const).map((key,i)=>{const p=points[points.length-1];return <text key={key} x="748" y={labelYs[i]-labelOverflow} fill={i===1?"#23854a":"#c63535"}>{["UCL","CL","LCL"][i]} {format(p[key])}</text>})}<text x="410" y="314" textAnchor="middle">시료 / 부분군 순서</text><text x="90" y="25">{plot.unit||"측정값"}</text>
 </svg></section>;
}
export default function SpcControlAnalysis({mode,text,subgroup,unit}:{mode:string;text:string;subgroup:number;unit:string}){
 const [settings,setSettings]=useState<{mode:string;patterns:boolean}>({mode,patterns:["xbar-r","xbar-s","i-mr"].includes(mode)});
 const patterns=settings.mode===mode?settings.patterns:["xbar-r","xbar-s","i-mr"].includes(mode);
 let result;try{result=calculateControl(mode as ControlMode,text,subgroup,unit)}catch(error){return <p role="alert" className="standard-note">{error instanceof Error?error.message:"입력값을 확인하세요."}</p>}
 const source=mode==="p"||mode==="np"?"pmc332":mode==="c"||mode==="u"?"pmc331":mode==="i-mr"?"pmc322":"pmc321";
 const analysed=result.plots.map((plot,i)=>({plot,signals:controlSignals(plot.points,i===0&&patterns)}));const events=analysed.flatMap(({plot,signals})=>plot.points.flatMap((p,i)=>signals[i].length?[{plot:plot.title,point:p.index,rules:signals[i].join(", ")}]:[]));const spreadSignal=analysed.length>1&&analysed[1].signals.some(s=>s.length>0);
 return <div className="spc-control-analysis"><p className="spc-line-legend"><span>🔴 UCL·LCL 관리한계</span><span>🟢 CL 중심선</span><span>🔵 측정값</span></p><label><input type="checkbox" checked={patterns} onChange={e=>setSettings({mode,patterns:e.target.checked})}/> 평균·비율 차트에 연속 패턴 N2~N8 추가 적용</label><p>기본값: X̄/I는 N1~N8, P/Pn/C/U는 N1. R/S/MR는 N1만 판정합니다. 계수치의 추가 패턴은 정규근사·표본수 조건을 검토한 뒤 선택합니다.</p><p role="status" className="standard-note">{spreadSignal?"산포 관리도 이상: 원인 조사와 안정화 전 평균 관리도의 안정 판정을 보류합니다.":events.length?`이상 신호 ${events.length}개 지점 — 규칙·영향 범위를 확인하고 조치 기준을 따르세요.`:"선택한 기준에서 이상 신호가 없습니다. 안정성과 제품 규격 적합성은 별도로 확인합니다."}</p>{analysed.map(({plot,signals})=><Plot key={plot.title} plot={plot} signals={signals}/>)}{events.length>0&&<table className="data-table"><thead><tr><th>관리도</th><th>시료·부분군</th><th>이상 규칙</th><th>조치</th></tr></thead><tbody>{events.map((e,i)=><tr key={i}><td>{e.plot}</td><td>{e.point}</td><td>{e.rules}</td><td>입력·측정 확인 → 영향 범위 확인 → 원인 조사·조치 → 검증·승인</td></tr>)}</tbody></table>}<section className="spc-formula-panel"><h3>계산식과 적용 조건</h3>{result.formulas.map(f=><p key={f}><code>{f}</code></p>)}{result.notes.map(note=><p key={note}>{note}</p>)}<p>부분군 수 k · 부분군 크기 n · d는 불량품수, c는 결점수입니다. 초기 자료로 계산한 한계는 잠정 기준이며 관리한계와 제품 규격한계는 다릅니다. 이탈점은 빨간색으로 표시합니다.</p><a target="_blank" rel="noreferrer" href={`https://www.itl.nist.gov/div898/handbook/pmc/section3/${source}.htm`}>NIST 계산식·사례 확인</a> · <a href="/spc-reference">전체 용어와 계산식</a></section><SpcJudgementGuide/></div>;
}
