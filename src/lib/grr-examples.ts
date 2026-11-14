// Synthetic crossed-study example: five parts, three operators, three repeats.
// Unsorted part means and varied within-cell ranges avoid an artificial staircase.
const centers=[10.027,10.137,10.077,10.107,10.047];
const offsets=[-.002,0,.002];
const noise=[[-.013,.005,.008],[-.006,.009,-.003],[.01,-.011,.001],[-.004,-.007,.011],[.007,.003,-.01]];
export const grrVariableExample=centers.flatMap((center,part)=>offsets.map((offset,operator)=>[`부품${String(part+1).padStart(2,'0')}`,`작업자 ${String.fromCharCode(65+operator)}`,...noise[(part*3+operator)%noise.length].map(value=>(center+offset+value).toFixed(3))].join(','))).join('\n');
