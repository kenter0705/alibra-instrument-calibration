export type ControlMode = "xbar-r" | "xbar-s" | "i-mr" | "p" | "np" | "c" | "u";
export const controlModes: {id:ControlMode;name:string;input:string;condition:string}[] = [
 {id:"xbar-r",name:"X̄-R 관리도",input:"시간순 측정값 · 부분군 2~10개",condition:"동일 크기의 합리적 부분군. R 산포를 먼저 확인합니다."},
 {id:"p",name:"P 관리도",input:"불량품수,검사수량",condition:"불량품률. 검사수량이 달라도 사용할 수 있습니다."},
 {id:"np",name:"Pn(np) 관리도",input:"불량품수,검사수량",condition:"불량품수. 모든 시료의 검사수량이 같아야 합니다."},
 {id:"c",name:"C 관리도",input:"결점수 · 한 행에 한 시료",condition:"동일한 검사 단위·면적·시간에서 결점수를 집계합니다."},
 {id:"u",name:"U 관리도",input:"결점수,검사단위크기",condition:"단위당 결점수. 검사 단위 크기가 달라도 사용할 수 있습니다."},
 {id:"i-mr",name:"I-MR 관리도",input:"시간순 개별 측정값",condition:"개별값과 인접 두 값의 이동범위를 함께 확인합니다."},
 {id:"xbar-s",name:"X̄-S 관리도",input:"시간순 측정값 · 동일 크기 부분군",condition:"부분군 평균과 표준편차를 함께 확인합니다."},
];
export const xrFactors:Record<number,[number,number,number]>={2:[1.880,0,3.267],3:[1.023,0,2.575],4:[.729,0,2.282],5:[.577,0,2.115],6:[.483,0,2.004],7:[.419,.076,1.924],8:[.373,.136,1.864],9:[.337,.184,1.816],10:[.308,.223,1.777]};
const c4:Record<number,number>={2:.797884561,3:.886226925,4:.921317732,5:.939985603,6:.951532862,7:.959368789,8:.965030456,9:.9693107,10:.972659274};
export type ControlPoint={index:number;value:number;center:number;upper:number;lower:number;standardError?:number};
export type ControlPlot={title:string;unit:string;points:ControlPoint[]};
const average=(a:number[])=>a.reduce((s,v)=>s+v,0)/a.length;
const point=(index:number,value:number,center:number,upper:number,lower:number,standardError=(upper-center)/3):ControlPoint=>({index,value,center,upper,lower,standardError});
export function calculateControl(mode:ControlMode,text:string,subgroup=5,unit=""): {plots:ControlPlot[];formulas:string[];notes:string[]} {
 if(!controlModes.some(m=>m.id===mode))throw new Error("관리도 종류를 선택하세요.");
 const notes:string[]=[];
 if(["xbar-r","xbar-s","i-mr"].includes(mode)){
  const cells=text.trim().split(/[\s,;]+/);if(!text.trim()||cells.some(v=>!v.trim()||!Number.isFinite(Number(v))))throw new Error("측정값은 빈 칸 없는 유한한 숫자로 입력하세요.");
  const values=cells.map(Number);if(values.length<2||values.length>5000)throw new Error("측정값 2~5000개를 입력하세요.");
  if(mode==="i-mr"){
   const mean=average(values),mr=values.slice(1).map((v,i)=>Math.abs(v-values[i])),r=average(mr),delta=3*r/1.128;
   return {plots:[{title:"I 관리도",unit,points:values.map((v,i)=>point(i+1,v,mean,mean+delta,mean-delta))},{title:"MR 관리도",unit,points:mr.map((v,i)=>point(i+2,v,r,3.267*r,0))}],formulas:["MRᵢ = |xᵢ − xᵢ₋₁|","I: CL=x̄, UCL/LCL=x̄ ± 3MR̄/1.128","MR: CL=MR̄, UCL=3.267MR̄, LCL=0"],notes};
  }
  if(!Number.isInteger(subgroup)||!xrFactors[subgroup])throw new Error("부분군 크기는 2~10의 정수입니다.");
  if(values.length%subgroup)throw new Error(`측정값 ${values.length}개를 부분군 크기 ${subgroup}으로 나눌 수 없습니다. 남는 값을 누락시키지 않고 입력을 확인합니다.`);
  const groups=Array.from({length:values.length/subgroup},(_,i)=>values.slice(i*subgroup,(i+1)*subgroup));if(groups.length<2)throw new Error("완전한 부분군이 2개 이상 필요합니다.");
  const means=groups.map(average),ranges=groups.map(g=>Math.max(...g)-Math.min(...g)),grand=average(means),rbar=average(ranges),[a,d3,d4]=xrFactors[subgroup];
  if(mode==="xbar-s"){
   const deviations=groups.map((g,i)=>Math.sqrt(g.reduce((s,v)=>s+(v-means[i])**2,0)/(subgroup-1))),sbar=average(deviations),delta=3*sbar/(c4[subgroup]*Math.sqrt(subgroup)),b=3*Math.sqrt(1-c4[subgroup]**2)/c4[subgroup];
   return {plots:[{title:"X̄ 관리도",unit,points:means.map((v,i)=>point(i+1,v,grand,grand+delta,grand-delta))},{title:"S 관리도",unit,points:deviations.map((v,i)=>point(i+1,v,sbar,sbar*(1+b),Math.max(0,sbar*(1-b))))}],formulas:["sᵢ = √[Σ(xᵢⱼ−x̄ᵢ)²/(n−1)]","X̄: CL=x̄̄, UCL/LCL=x̄̄ ± 3s̄/(c₄√n)","S: CL=s̄, UCL/LCL=s̄[1 ± 3√(1−c₄²)/c₄] (LCL은 0 이상)"],notes};
  }
  return {plots:[{title:"X̄ 관리도 · 부분군 평균",unit,points:means.map((v,i)=>point(i+1,v,grand,grand+a*rbar,grand-a*rbar))},{title:"R 관리도 · 부분군 범위",unit,points:ranges.map((v,i)=>point(i+1,v,rbar,d4*rbar,d3*rbar))}],formulas:["x̄ᵢ=Σxᵢⱼ/n, Rᵢ=최대값−최소값, x̄̄=Σx̄ᵢ/k, R̄=ΣRᵢ/k",`n=${subgroup}: A₂=${a}, D₃=${d3}, D₄=${d4}`,"X̄: CL=x̄̄, UCL=x̄̄+A₂R̄, LCL=x̄̄−A₂R̄","R: CL=R̄, UCL=D₄R̄, LCL=D₃R̄"],notes:["R 관리도를 먼저 확인하고 산포가 안정된 뒤 X̄ 관리도를 해석합니다."]};
 }
 const rows=text.trim().split(/\r?\n/).filter(s=>s.trim()).map((line,i)=>{
  const cells=line.split(/[\t,]/).map(v=>v.trim()),expected=mode==="c"?1:2;
  if(cells.length!==expected||cells.some(v=>!v||!Number.isFinite(Number(v))))throw new Error(`${i+1}행: ${controlModes.find(m=>m.id===mode)!.input} 형식으로 입력하세요.`);
  const count=Number(cells[0]),size=expected===1?1:Number(cells[1]);
  if(!Number.isSafeInteger(count)||count<0||size<=0||((mode==="p"||mode==="np")&&(!Number.isSafeInteger(size)||count>size)))throw new Error(`${i+1}행: 건수는 0 이상 정수, 검사 크기는 양수이며 불량품수는 검사수량 이하여야 합니다.`);
  return {count,size};
 });
 if(rows.length<2||rows.length>5000)throw new Error("검사 시료 2~5000행을 입력하세요.");
 if(mode==="np"&&rows.some(r=>r.size!==rows[0].size))throw new Error("Pn(np) 관리도는 검사수량이 일정해야 합니다. 검사수량이 다르면 P 관리도를 사용하세요.");
 const rate=rows.reduce((s,r)=>s+r.count,0)/rows.reduce((s,r)=>s+r.size,0),center=mode==="np"?rate*rows[0].size:rate;
 const points=rows.map((r,i)=>{const value=mode==="p"||mode==="u"?r.count/r.size:r.count,delta=3*Math.sqrt(mode==="p"?rate*(1-rate)/r.size:mode==="np"?center*(1-rate):mode==="u"?rate/r.size:center);return point(i+1,value,center,Math.min(mode==="p"?1:mode==="np"?r.size:Infinity,center+delta),Math.max(0,center-delta),delta/3)});
 const formulas=mode==="p"?["pᵢ=dᵢ/nᵢ, p̄=Σdᵢ/Σnᵢ, CL=p̄","UCLᵢ/LCLᵢ=p̄ ± 3√[p̄(1−p̄)/nᵢ]"]:mode==="np"?["p̄=Σdᵢ/Σnᵢ, CL=np̄","UCL/LCL=np̄ ± 3√[np̄(1−p̄)]"]:mode==="c"?["c̄=Σcᵢ/k, CL=c̄","UCL/LCL=c̄ ± 3√c̄"]:["uᵢ=cᵢ/nᵢ, ū=Σcᵢ/Σnᵢ, CL=ū","UCLᵢ/LCLᵢ=ū ± 3√(ū/nᵢ)"];
 notes.push("음수 관리하한은 0으로 제한합니다.");
 if(mode==="p"||mode==="np")notes.push("비율은 0~1, 불량품수는 0~검사수량 범위로 한계를 제한합니다. 이항모형·독립성을 확인하세요.");else notes.push("한 제품에 결점이 여러 개 존재할 수 있습니다. 포아송모형과 검사 기회의 동질성을 확인하세요.");
 return {plots:[{title:controlModes.find(m=>m.id===mode)!.name,unit:mode==="p"?"%":mode==="u"?"결점/단위":"개",points}],formulas,notes};
}

// NIST wafer data: 30 wafers, 50 chips per wafer. Fractions converted to counts.
export const nistFractions=[.24,.30,.16,.20,.08,.14,.32,.18,.28,.20,.10,.12,.34,.24,.44,.16,.20,.10,.26,.22,.40,.36,.48,.30,.18,.24,.14,.26,.18,.12];
export function controlExample(mode:ControlMode){
 if(mode==="p"||mode==="np")return nistFractions.map(p=>`${Math.round(p*50)},50`).join("\n");
 if(mode==="c")return [2,3,1,5,4,2,0,3,6,2,4,1,3,2,5,1,4,2,3,2].join("\n");
 if(mode==="u")return [[2,1],[5,2],[1,.5],[6,3],[3,1.5],[4,2],[2,1],[7,3.5]].map(r=>r.join(",")).join("\n");
 return Array.from({length:50},(_,i)=>(10+Math.sin(i*1.71)*.036+Math.cos(i*.63)*.018+((i%5)-2)*.003).toFixed(3)).join("\n");
}
