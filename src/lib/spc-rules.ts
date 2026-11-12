import type {ControlPoint} from "@/lib/spc-control";
export const spcRules=[
 {id:"N1",criterion:"1점이 UCL 초과 또는 LCL 미만",meaning:"관리한계 이탈",action:"측정·입력 오류와 변경 이력을 확인하고 특별원인 및 영향 범위를 조사합니다.",example:[0,.3,-.4,.1,3.5]},
 {id:"N2",criterion:"9점 연속 중심선의 같은 쪽",meaning:"공정 중심 이동 가능성",action:"설정값·원료·작업자·설비 변경 시점을 대조합니다.",example:[.4,.8,.5,.7,.3,.6,.9,.5,.8]},
 {id:"N3",criterion:"6점 연속 증가 또는 감소",meaning:"시간에 따른 추세",action:"공구 마모·온도·교정 드리프트 등을 확인합니다.",example:[-1.4,-.9,-.4,.1,.6,1.1]},
 {id:"N4",criterion:"14점 연속 위아래 방향 교대",meaning:"주기성·과잉 조정 가능성",action:"설비 주기·작업 교대·반복 조정 이력을 확인합니다.",example:[.5,1,.6,1.1,.7,1.2,.8,1.3,.9,1.4,1,1.5,1.1,1.6]},
 {id:"N5",criterion:"연속 3점 중 2점이 같은 쪽 2σ 초과",meaning:"평균 이동 가능성",action:"해당 구간과 직전 정상 구간의 공정 조건을 비교합니다.",example:[2.2,.8,2.5]},
 {id:"N6",criterion:"연속 5점 중 4점이 같은 쪽 1σ 초과",meaning:"작은 중심 이동 가능성",action:"조건 변화와 측정 체계의 변화를 추적합니다.",example:[1.2,1.6,.4,1.3,1.7]},
 {id:"N7",criterion:"15점 연속 중심선 ±1σ 안",meaning:"산포 축소·층별 혼합·측정 분해능 문제 가능성",action:"부분군 구성·반올림·분해능·실제 개선 여부를 확인합니다.",example:[.2,-.3,.4,-.1,.5,-.2,.1,-.4,.3,-.5,.2,-.1,.4,-.2,.3]},
 {id:"N8",criterion:"8점 연속 ±1σ 밖이며 중심선 양쪽에 분포",meaning:"공정 혼합·층별 차이 가능성",action:"설비·로트·작업조별로 자료를 나눠 원인을 조사합니다.",example:[1.3,-1.4,1.2,-1.8,1.6,-1.2,1.5,-1.3]},
];
export function controlSignals(points:ControlPoint[],patterns:boolean){
 const z=points.map(p=>{const sigma=p.standardError??(p.upper-p.center)/3;return sigma>0?(p.value-p.center)/sigma:NaN});
 return points.map((p,i)=>{
  const hits:string[]=[];if(p.value>p.upper||p.value<p.lower)hits.push("N1");if(!patterns)return hits;
  const w=(length:number)=>i+1>=length?z.slice(i+1-length,i+1):[];
  const nine=w(9);if(nine.length===9&&(nine.every(v=>v>0)||nine.every(v=>v<0)))hits.push("N2");
  const six=w(6);if(six.length===6&&(six.every((v,j)=>j===0||v>six[j-1])||six.every((v,j)=>j===0||v<six[j-1])))hits.push("N3");
  const fourteen=w(14),diff=fourteen.slice(1).map((v,j)=>v-fourteen[j]);if(fourteen.length===14&&diff.every((v,j)=>v!==0&&(j===0||v*diff[j-1]<0)))hits.push("N4");
  const three=w(3);if(three.length===3&&[1,-1].some(sign=>three.filter(v=>sign*v>2).length>=2))hits.push("N5");
  const five=w(5);if(five.length===5&&[1,-1].some(sign=>five.filter(v=>sign*v>1).length>=4))hits.push("N6");
  const fifteen=w(15);if(fifteen.length===15&&fifteen.every(v=>Math.abs(v)<1))hits.push("N7");
  const eight=w(8);if(eight.length===8&&eight.every(v=>Math.abs(v)>1)&&eight.some(v=>v>0)&&eight.some(v=>v<0))hits.push("N8");
  return hits;
 });
}
