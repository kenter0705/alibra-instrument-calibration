export type GrrGroup={part:string;operator:string;values:(number|string)[]};
export type UncertaintySource={name:string;standardUncertainty:number};
export type GrrData={studyType:"계량치"|"계수치";operators:string[];parts:string[];repeats:number;groups:GrrGroup[];uncertaintySources:UncertaintySource[]};
export function analyzeGrr(data:GrrData,lowerSpec?:number|null,upperSpec?:number|null){
  const groups=data.groups.filter(g=>g.values.length);const all=groups.flatMap(g=>g.values.map(Number).filter(Number.isFinite));
  if(data.studyType==="계수치"){
    const categories=[...new Set(groups.flatMap(g=>g.values.map(String)))];const byPart=data.parts.map(part=>{const values=groups.filter(g=>g.part===part).flatMap(g=>g.values.map(String));const bad=values.filter(v=>/불합격|NG|불량|부적합/i.test(v)).length;return {part,n:values.length,bad,rate:values.length?bad/values.length:0}}).filter(x=>x.n);
    const items=data.parts.map(part=>groups.filter(g=>g.part===part).flatMap(g=>g.values.map(String))).filter(a=>a.length>1);const m=items[0]?.length??0;
    const pbar=items.length&&m>1?items.reduce((s,arr)=>{const counts=new Map<string,number>();arr.forEach(v=>counts.set(v,(counts.get(v)??0)+1));const sum=[...counts.values()].reduce((n,c)=>n+c*c,0);return s+(sum-m)/(m*(m-1))},0)/items.length:0;
    const allRatings=items.flat();const proportions=categories.map(c=>allRatings.filter(v=>v===c).length/(allRatings.length||1));const pe=proportions.reduce((s,p)=>s+p*p,0);const kappa=pe<1?(pbar-pe)/(1-pe):1;
    const repeatGroups=groups.filter(g=>g.values.length>1);const repeatability=repeatGroups.length?repeatGroups.filter(g=>g.values.every(v=>String(v)===String(g.values[0]))).length/repeatGroups.length*100:0;
    const p=byPart.reduce((s,x)=>s+x.bad,0)/(byPart.reduce((s,x)=>s+x.n,0)||1);const avgN=byPart.length?byPart.reduce((s,x)=>s+x.n,0)/byPart.length:1;const sigma=Math.sqrt(p*(1-p)/avgN);
    return {studyType:data.studyType,samples:allRatings.length,groups:groups.length,repeatability,kappa,agreement:pbar*100,chart:byPart.map(x=>({...x,center:p,upper:Math.min(1,p+3*sigma),lower:Math.max(0,p-3*sigma)})),categories,uncertainty:null as null};
  }
  if(!all.length)return null;
  const mean=all.reduce((s,x)=>s+x,0)/all.length;const ops=data.operators;const parts=data.parts;const r=data.repeats;const o=ops.length;const p=parts.length;
  if(o<2||p<2||r<2||groups.length<p*o)return null;
  const avg=(xs:number[])=>xs.length?xs.reduce((s,x)=>s+x,0)/xs.length:mean;
  const cell=(part:string,operator:string)=>groups.find(g=>g.part===part&&g.operator===operator)?.values.map(Number).filter(Number.isFinite)??[];
  const partMeans=new Map(parts.map(part=>[part,avg(ops.flatMap(op=>cell(part,op)))]));const opMeans=new Map(ops.map(op=>[op,avg(parts.flatMap(part=>cell(part,op)))]));
  let ssE=0,ssPO=0,ssP=0,ssO=0,ssCells=0;for(const part of parts){ssP+=o*r*(partMeans.get(part)!-mean)**2;for(const op of ops){const values=cell(part,op);const cm=avg(values);ssCells+=r*(cm-partMeans.get(part)!-opMeans.get(op)!+mean)**2;for(const x of values)ssE+=(x-cm)**2;}}
  for(const op of ops)ssO+=p*r*(opMeans.get(op)!-mean)**2;ssPO=ssCells;
  const dfE=p*o*(r-1),dfPO=(p-1)*(o-1),dfO=o-1,dfP=p-1;const msE=ssE/Math.max(1,dfE),msPO=ssPO/Math.max(1,dfPO),msO=ssO/Math.max(1,dfO),msP=ssP/Math.max(1,dfP);
  const repeatVar=msE,interactionVar=Math.max(0,(msPO-msE)/r),operatorVar=Math.max(0,(msO-msPO)/(p*r)),partVar=Math.max(0,(msP-msPO)/(o*r));const rrVar=repeatVar+interactionVar+operatorVar,totalVar=rrVar+partVar;const sigma=Math.sqrt(totalVar),rrSigma=Math.sqrt(rrVar);const typeA=Math.sqrt(repeatVar);const typeB=Math.sqrt(data.uncertaintySources.reduce((s,x)=>s+x.standardUncertainty**2,0));const uc=Math.sqrt(typeA**2+typeB**2);const tolerance=lowerSpec!=null&&upperSpec!=null?upperSpec-lowerSpec:null;
  const xbar=parts.flatMap(part=>ops.map(operator=>({part,operator,mean:avg(cell(part,operator)),range:Math.max(...cell(part,operator).map(Number))-Math.min(...cell(part,operator).map(Number))})));const rbar=xbar.reduce((s,x)=>s+x.range,0)/(xbar.length||1);const a2=r===2?1.88:r===3?1.023:r===4?.729:.577;
  return {studyType:data.studyType,samples:all.length,groups:groups.length,mean,repeatability:typeA,operatorSigma:Math.sqrt(operatorVar),partSigma:Math.sqrt(partVar),rrSigma,totalSigma:sigma,rrPercent:totalVar?rrSigma/sigma*100:0,contribution:totalVar?rrVar/totalVar*100:0,ndc:rrSigma?Math.floor(1.41*Math.sqrt(partVar)/rrSigma):0,pt:tolerance&&tolerance>0?6*rrSigma/tolerance*100:null,uncertainty:{typeA,typeB,combined:uc,expanded:2*uc},chart:xbar.map(x=>({...x,upper:mean+a2*rbar,lower:mean-a2*rbar,rUpper:(r===2?3.267:r===3?2.574:r===4?2.282:2.114)*rbar}))};
}
