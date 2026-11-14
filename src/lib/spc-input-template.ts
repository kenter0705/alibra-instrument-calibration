export const spcInputTemplates=[
 {id:"xbar-r",sheet:"Xbar-R",chart:"histogram",tool:6,mode:"xbar-r",subgroup:5,columns:["부분군","측정1","측정2","측정3","측정4","측정5"],note:"한 행에 부분군 번호와 측정값 5개를 입력하세요. 25개 부분군 이상을 권장합니다."},
 {id:"xbar-s",sheet:"Xbar-S",chart:"histogram",tool:6,mode:"xbar-s",subgroup:10,columns:["부분군","측정1","측정2","측정3","측정4","측정5","측정6","측정7","측정8","측정9","측정10"],note:"한 행에 부분군 번호와 측정값 10개를 입력하세요. 25개 부분군 이상을 권장합니다."},
 {id:"i-mr",sheet:"I-MR",chart:"imr",tool:6,mode:"i-mr",subgroup:1,columns:["순서","측정값"],note:"시간순으로 25행 이상 입력합니다."},
 {id:"p",sheet:"P",chart:"p",tool:6,mode:"p",subgroup:1,columns:["검사수량","불량품수"],note:"검사수량과 불량품수를 입력합니다. 불량품수는 검사수량 이하입니다."},
 {id:"np",sheet:"Pn",chart:"np",tool:6,mode:"np",subgroup:1,columns:["검사수량","불량품수"],note:"모든 행의 검사수량을 동일하게 입력합니다."},
 {id:"c",sheet:"C",chart:"c",tool:6,mode:"c",subgroup:1,columns:["결점수"],note:"동일한 검사 단위마다 결점수를 입력합니다."},
 {id:"u",sheet:"U",chart:"u",tool:6,mode:"u",subgroup:1,columns:["검사단위수","결점수"],note:"검사 단위 크기와 결점수를 입력합니다. 검사단위수는 양수입니다."},
 {id:"checksheet",sheet:"체크시트",chart:"checksheet",tool:0,columns:["불량유형","건수"],note:"유형별 건수를 입력합니다. 발생이 없으면 0을 입력합니다."},
 {id:"checksheet-distribution",sheet:"분포체크시트",chart:"histogram",tool:0,columns:["측정값"],note:"측정 원자료를 한 셀에 하나씩 입력합니다. 앱에서 분포별 도수로 집계합니다."},
 {id:"histogram",sheet:"히스토그램",chart:"histogram",tool:2,columns:["측정값"],note:"측정 원자료를 한 셀에 하나씩 입력합니다."},
 {id:"pareto",sheet:"파레토",chart:"pareto",tool:1,columns:["불량유형","건수"],note:"불량 유형과 발생 건수를 입력합니다."},
 {id:"fishbone",sheet:"특성요인",chart:"fishbone",tool:3,columns:["원인분류","원인"],note:"사람·설비·방법·재료·측정·환경 등으로 원인을 분류합니다."},
 {id:"scatter",sheet:"산점도",chart:"scatter",tool:4,columns:["X","Y"],note:"같은 관측에서 얻은 X와 Y를 한 행에 입력합니다."},
 {id:"stratification",sheet:"층별",chart:"stratification",tool:5,columns:["그룹","측정값"],note:"설비·작업자 등 그룹명과 측정값을 입력합니다."},
] as const;
export function spcTemplateId(tool:number,mode:string,distribution:boolean){return tool===6?mode:tool===0?(distribution?"checksheet-distribution":"checksheet"):["checksheet","pareto","histogram","fishbone","scatter","stratification"][tool]||"histogram"}
