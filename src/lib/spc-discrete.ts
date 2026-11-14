export type TrialRow={n:number;k:number};
export function parseTrialRows(text:string,maxN=5000):TrialRow[]{
 const lines=text.split(/\r?\n/).filter(line=>line.split(/[,\t]/).some(value=>value.trim()));if(!lines.length)throw new Error('시행 수와 관측 건수를 입력하세요.');if(lines.length>5000)throw new Error('5000행 이내로 입력하세요.');
 return lines.map((line,index)=>{const cells=line.split(/[,\t]/).map(v=>v.trim());if(cells.length!==2||cells.some(v=>!v))throw new Error(`${index+1}행의 두 열을 모두 입력하세요.`);const [n,k]=cells.map(Number);if(!Number.isInteger(n)||n<1||n>maxN||!Number.isInteger(k)||k<0||k>n)throw new Error(`${index+1}행: 시행 수는 1~${maxN} 정수, 관측 건수는 0~시행 수의 정수입니다.`);return {n,k}});
}
function check(n:number,p:number){if(!Number.isInteger(n)||n<1||n>5000||!Number.isFinite(p)||p<0||p>1)throw new Error('시행 수와 0~1 확률을 확인하세요.')}
export function binomialProbabilities(n:number,p:number){check(n,p);let logCombination=0;return Array.from({length:n+1},(_,k)=>{if(k>0)logCombination+=Math.log(n-k+1)-Math.log(k);const probability=p===0?(k===0?1:0):p===1?(k===n?1:0):Math.exp(logCombination+k*Math.log(p)+(n-k)*Math.log1p(-p));return {k,probability}})}
export function acceptanceProbability(n:number,c:number,p:number){check(n,p);if(!Number.isInteger(c)||c<0||c>n)throw new Error('합격판정 개수 c는 0~표본 수의 정수입니다.');if(c===n||p===0)return 1;if(p===1)return 0;let logCombination=0,total=0;for(let k=0;k<=c;k++){if(k>0)logCombination+=Math.log(n-k+1)-Math.log(k);total+=Math.exp(logCombination+k*Math.log(p)+(n-k)*Math.log1p(-p))}return Math.min(1,Math.max(0,total))}
export function commonTrialSize(rows:TrialRow[]){const n=rows[0]?.n;if(!n||rows.some(row=>row.n!==n))throw new Error('한 분포·OC곡선으로 비교할 행은 시행 수 n이 같아야 합니다. 크기가 다른 자료는 나누어 분석하세요.');return n}
