import {controlExample,controlModes,type ControlMode} from "@/lib/spc-control";
export type SpcExample={id:string;title:string;tool:number;text:string;dataType:string;source:string;mode?:ControlMode;checksheetMode?:"category"|"distribution";subgroup?:number};
const counts="치수,12\n스크래치,8\n기공,5\n오염,3";
export const checksheetExample="크랙,12\n치수,7\n변형,4\n흑점,6\n미성형,5\n변색,3\n이물질,2\n싱크,4\n기타,1";
export const spcExamples:SpcExample[]=[
 {id:"checksheet-category",title:"체크시트 · 불량 유형 9종 원본 예시",tool:0,text:checksheetExample,dataType:"계수치",source:"합성 학습 예시",checksheetMode:"category"},
 {id:"checksheet-distribution",title:"체크시트 · 분포별 도수 원본 예시",tool:0,text:controlExample("i-mr"),dataType:"계량치",source:"합성 학습 예시",checksheetMode:"distribution"},
 {id:"pareto",title:"파레토도 · 28건 원본 예시",tool:1,text:counts,dataType:"계수치",source:"합성 학습 예시"},
 {id:"histogram",title:"히스토그램 · 측정값 50개 원본 예시",tool:2,text:controlExample("i-mr"),dataType:"계량치",source:"합성 학습 예시"},
 {id:"fishbone",title:"특성요인도 · 치수 산포 증가 원본 예시",tool:3,text:"사람,작업 방법 숙련도 차이\n사람,표준작업 교육 부족\n설비,공구 마모\n설비,고정구 유격\n방법,절삭 조건 편차\n재료,원재료 로트 차이\n측정,측정기 반복성\n환경,온도 변화",dataType:"계수치",source:"합성 원인 가설 예시"},
 {id:"scatter",title:"산점도 · X·Y 쌍 원본 예시",tool:4,text:"1,2.1\n2,3.9\n3,6.0\n4,7.8\n5,10.2",dataType:"계량치",source:"합성 학습 예시"},
 {id:"strata",title:"층별 · 설비별 불량 건수 원본 예시",tool:5,text:"설비 A,16\n설비 B,40\n설비 C,8",dataType:"계수치",source:"합성 학습 예시"},
 ...controlModes.map(mode=>({id:mode.id,title:mode.name+" 원본 예시",tool:6,text:controlExample(mode.id),dataType:["p","np","c","u"].includes(mode.id)?"계수치":"계량치",source:mode.id==="p"||mode.id==="np"?"NIST 공개 웨이퍼 30개 · 50칩/웨이퍼":"합성 학습 예시",mode:mode.id,subgroup:mode.id==="i-mr"?1:mode.id==="xbar-s"?10:5})),
];
