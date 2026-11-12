export type Frequency={label:string;count:number;lower?:number;upper?:number};
export function categoryFrequencies(text:string):Frequency[]{
 const groups=new Map<string,number>();
 text.split(/\r?\n/).filter(s=>s.trim()).forEach((line,i)=>{const cells=line.split(","),name=cells[0]?.trim(),raw=cells[1]?.trim(),count=Number(raw);if(cells.length!==2||!name||!raw||!Number.isSafeInteger(count)||count<0||count>100000)throw new Error(`${i+1}행: 유형,도수 형식으로 0~100000의 정수를 입력하세요.`);groups.set(name,(groups.get(name)||0)+count)});
 if(!groups.size)throw new Error("유형과 도수를 입력하세요.");return [...groups].map(([label,count])=>({label,count}));
}
export function distributionFrequencies(text:string,binCount=7):Frequency[]{
 if(!text.trim())throw new Error("측정값을 입력하세요.");const cells=text.trim().split(/[\s,;]+/);if(cells.some(v=>!Number.isFinite(Number(v))))throw new Error("측정값은 숫자로 입력하세요.");const values=cells.map(Number);
 if(values.length>5000)throw new Error("측정값은 5000개 이하로 입력하세요.");if(!Number.isInteger(binCount)||binCount<1||binCount>50)throw new Error("계급 수는 1~50의 정수입니다.");
 const low=Math.min(...values),high=Math.max(...values),width=(high-low||Math.max(Math.abs(low)*.01,1))/binCount;
 const rows=Array.from({length:binCount},(_,i)=>{const lower=low+i*width,upper=low+(i+1)*width;return {label:`${Number(lower.toPrecision(7))} 이상 ~ ${Number(upper.toPrecision(7))} ${i===binCount-1?"이하":"미만"}`,count:0,lower,upper}});
 values.forEach(v=>rows[Math.min(binCount-1,Math.max(0,Math.floor((v-low)/width)))].count++);return rows;
}
