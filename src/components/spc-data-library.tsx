"use client";
import SpcActionBar from "@/components/spc-action-bar";
import React,{useRef,useState} from "react";
import {Save,FolderOpen,BookOpen,Download} from "lucide-react";
import {spcInputTemplates} from "@/lib/spc-input-template";
import {spcExamples} from "@/lib/spc-examples";
type SavedInput={id:string;studyNumber:string;title:string};
export default function SpcDataLibrary({rows,onLoad,onExample,onImport,onExport,templateId}:{rows:SavedInput[];onLoad:(id:string)=>void;onExample:(id:string)=>void;onImport:(file:File)=>Promise<void>;onExport:()=>void;templateId:string}){
 const examples=spcExamples.filter(item=>item.id===(templateId==="checksheet"?"checksheet-category":templateId==="stratification"?"strata":templateId));
 const [panel,setPanel]=useState<"examples"|"legacy"|null>(null),[importing,setImporting]=useState(false),[error,setError]=useState(""),fileInput=useRef<HTMLInputElement>(null);
 return <section className="spc-data-library" aria-label="내 기기 데이터 저장과 불러오기"><SpcActionBar>
 <button type="button" className="primary-button" onClick={onExport}><Save size={17}/>내 기기에 새 파일로 저장</button>
 <button type="button" className="secondary-button" disabled={importing} onClick={()=>fileInput.current?.click()}><FolderOpen size={17}/>{importing?"파일 읽는 중…":"내 기기 저장 파일 불러오기"}</button>
 <button type="button" className="spc-example-button secondary-button" aria-expanded={panel==="examples"} onClick={()=>setPanel(panel==="examples"?null:"examples")}><BookOpen size={17}/>현재 도구 예시 불러오기</button>
 <a className="secondary-button" href={`/spc-input-templates/${templateId}.xlsx`} download><Download size={17}/>{spcInputTemplates.find(item=>item.id===templateId)?.sheet} 입력 양식 내려받기</a>
 {rows.length>0&&<button type="button" className="secondary-button" onClick={()=>setPanel(panel==="legacy"?null:"legacy")}>기존 등록 자료 사본 불러오기</button>}
 <input hidden ref={fileInput} type="file" accept=".json,.csv,.xlsx" onChange={async event=>{const file=event.target.files?.[0];event.target.value="";if(!file)return;setImporting(true);setError("");try{await onImport(file);setPanel(null)}catch(error){setError(error instanceof Error?error.message:"파일을 불러오지 못했습니다.")}finally{setImporting(false)}}}/></SpcActionBar>
 {error&&<p role="alert">{error}</p>}<p>실습 자료는 내 기기의 파일에서 읽고 새 이름의 JSON 사본으로 저장합니다. 예시·불러온 원본은 덮어쓰지 않습니다.</p>
 {panel==="examples"&&<div className="spc-library-panel"><h3>현재 도구 학습 예시</h3><div className="spc-example-cards">{examples.map(example=><button type="button" key={example.id} data-example-id={example.id} onClick={()=>{onExample(example.id);setPanel(null)}}><strong>{example.title.replace(" 원본 예시","")}</strong><span>{example.dataType} · {example.source}</span><b>사본 불러오기 →</b></button>)}</div></div>}
 {panel==="legacy"&&<div className="spc-library-panel"><h3>기존 등록 자료 · 원본 보존</h3>{rows.map(row=><button type="button" key={row.id} onClick={()=>{onLoad(row.id);setPanel(null)}}>{row.studyNumber} · {row.title} · 사본 불러오기</button>)}</div>}</section>;
}
