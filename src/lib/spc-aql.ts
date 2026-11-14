// Public-domain reference: US DoD MIL-STD-105E (1989), Tables I and II-A.
// This historical reference is not a claim of current ISO/ANSI certification.
export const aqlReference={id:'mil-std-105e-1989-normal-single',title:'MIL-STD-105E (1989) · 표 I / II-A · 정상·1회·계수형 참고표',url:'https://www.sqconline.com/sites/sqconline.com/files/MIL-STD-105E.pdf'} as const;
export const inspectionLevels=['I','II','III','S-1','S-2','S-3','S-4'] as const;
export type InspectionLevel=typeof inspectionLevels[number];
export const sampleLetters=['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R'] as const;
export const sampleSizes=[2,3,5,8,13,20,32,50,80,125,200,315,500,800,1250,2000] as const;
export const aqlValues=[.01,.015,.025,.04,.065,.1,.15,.25,.4,.65,1,1.5,2.5,4,6.5,10] as const;
// Columns: S-1,S-2,S-3,S-4,I,II,III. Upper bounds are inclusive.
export const lotCodeRows=[
 {min:2,max:8,codes:['A','A','A','A','A','A','B']},
 {min:9,max:15,codes:['A','A','A','A','A','B','C']},
 {min:16,max:25,codes:['A','A','B','B','B','C','D']},
 {min:26,max:50,codes:['A','B','B','C','C','D','E']},
 {min:51,max:90,codes:['B','B','C','C','C','E','F']},
 {min:91,max:150,codes:['B','B','C','D','D','F','G']},
 {min:151,max:280,codes:['B','C','D','E','E','G','H']},
 {min:281,max:500,codes:['B','C','D','E','F','H','J']},
 {min:501,max:1200,codes:['C','C','E','F','G','J','K']},
 {min:1201,max:3200,codes:['C','D','E','G','H','K','L']},
 {min:3201,max:10000,codes:['C','D','F','G','J','L','M']},
 {min:10001,max:35000,codes:['C','D','F','H','K','M','N']},
 {min:35001,max:150000,codes:['D','E','G','J','L','N','P']},
 {min:150001,max:500000,codes:['D','E','G','J','M','P','Q']},
 {min:500001,max:Infinity,codes:['D','E','H','K','N','Q','R']},
] as const;
export const lotLevelColumns=['S-1','S-2','S-3','S-4','I','II','III'] as const;
// Explicit numeric cells of Table II-A, up to AQL 10% (percent nonconforming).
const acceptanceCells:Record<string,Record<number,number>>={
 '.01':{14:0},'.015':{13:0},'.025':{12:0,15:1},'.04':{11:0,14:1,15:2},
 '.065':{10:0,13:1,14:2,15:3},'.1':{9:0,12:1,13:2,14:3,15:5},
 '.15':{8:0,11:1,12:2,13:3,14:5,15:7},'.25':{7:0,10:1,11:2,12:3,13:5,14:7,15:10},
 '.4':{6:0,9:1,10:2,11:3,12:5,13:7,14:10,15:14},'.65':{5:0,8:1,9:2,10:3,11:5,12:7,13:10,14:14,15:21},
 '1':{4:0,7:1,8:2,9:3,10:5,11:7,12:10,13:14,14:21},
 '1.5':{3:0,6:1,7:2,8:3,9:5,10:7,11:10,12:14,13:21},
 '2.5':{2:0,5:1,6:2,7:3,8:5,9:7,10:10,11:14,12:21},
 '4':{1:0,4:1,5:2,6:3,7:5,8:7,9:10,10:14,11:21},
 '6.5':{0:0,3:1,4:2,5:3,6:5,7:7,8:10,9:14,10:21},
 '10':{1:1,2:2,3:3,4:5,5:7,6:10,7:14,8:21},
};
function cellsFor(aql:number){const key=String(aql).replace(/^0\./,'.'),cells=acceptanceCells[key];if(!cells)throw new Error('도표에 있는 AQL(0.01~10%)을 선택하세요.');return cells}
export function aqlTableCell(row:number,aql:number):{kind:'plan';ac:number;re:number}|{kind:'arrow';direction:'up'|'down';target:number}{
 if(!Number.isInteger(row)||row<0||row>=sampleLetters.length)throw new Error('표본문자를 확인하세요.');const cells=cellsFor(aql);if(Object.hasOwn(cells,row))return {kind:'plan',ac:cells[row],re:cells[row]+1};const indexes=Object.keys(cells).map(Number).sort((a,b)=>a-b),first=indexes[0],last=indexes[indexes.length-1];
 let direction:'up'|'down';if(row<first)direction='down';else if(row>last)direction='up';else if(row===first+1)direction='up';else if(row===first+2)direction='down';else throw new Error('참고표의 화살표 데이터가 없습니다.');const target=direction==='down'?indexes.find(index=>index>row):[...indexes].reverse().find(index=>index<row);if(target===undefined)throw new Error('화살표 이동 대상을 확인하세요.');return {kind:'arrow',direction,target};
}
export type AqlInspectionPlan={source:string;lotSize:number;level:InspectionLevel;aql:number;lotRow:number;initialCode:string;initialN:number;appliedCode:string;lookupN:number;n:number;ac:number|null;re:number|null;fullInspection:boolean;arrow:'up'|'down'|null};
export function selectAqlPlan(lotSize:number,level:InspectionLevel,aql:number):AqlInspectionPlan{
 if(!Number.isSafeInteger(lotSize)||lotSize<1)throw new Error('검사 로트 크기 N은 1 이상의 정수입니다.');if(!inspectionLevels.includes(level))throw new Error('검사수준을 선택하세요.');cellsFor(aql);
 if(lotSize===1)return {source:aqlReference.id,lotSize,level,aql,lotRow:-1,initialCode:'—',initialN:1,appliedCode:'—',lookupN:1,n:1,ac:null,re:null,fullInspection:true,arrow:null};
 const lotRow=lotCodeRows.findIndex(row=>lotSize>=row.min&&lotSize<=row.max),column=lotLevelColumns.indexOf(level),initialCode=lotCodeRows[lotRow].codes[column],initialIndex=sampleLetters.indexOf(initialCode),cell=aqlTableCell(initialIndex,aql),appliedIndex=cell.kind==='plan'?initialIndex:cell.target,resolved=aqlTableCell(appliedIndex,aql);if(resolved.kind!=='plan')throw new Error('AQL 도표 이동을 확인하세요.');const lookupN=sampleSizes[appliedIndex],fullInspection=lookupN>=lotSize;
 return {source:aqlReference.id,lotSize,level,aql,lotRow,initialCode,initialN:sampleSizes[initialIndex],appliedCode:sampleLetters[appliedIndex],lookupN,n:fullInspection?lotSize:lookupN,ac:fullInspection?null:resolved.ac,re:fullInspection?null:resolved.re,fullInspection,arrow:cell.kind==='arrow'?cell.direction:null};
}
