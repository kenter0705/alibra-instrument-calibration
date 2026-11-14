import type {UncertaintySource} from './grr-analysis';
export type GrrUncertaintyInputs={method:'certificate-text-v1';certificateText:string;resolution:string;measurementUnit:string};
const unitGroups=[['m','cm','mm','μm','nm'],['Pa','kPa','MPa','bar'],['V','mV','μV'],['A','mA','μA'],['kg','g','mg']];
const scales:Record<string,number>={m:1,cm:.01,mm:.001,'μm':1e-6,nm:1e-9,Pa:1,kPa:1000,MPa:1e6,bar:1e5,V:1,mV:.001,'μV':1e-6,A:1,mA:.001,'μA':1e-6,kg:1,g:.001,mg:1e-6};
const normalize=(unit:string)=>unit.trim().replaceAll('µ','μ').replaceAll('㎛','μm').replace(/^um$/,'μm');
function convert(value:number,from:string,to:string){from=normalize(from);to=normalize(to);if(from===to)return value;if(!unitGroups.some(group=>group.includes(from)&&group.includes(to)))throw Error(`성적서 단위 ${from}를 측정 단위 ${to}로 바꿀 수 없습니다. 단위를 확인하세요.`);return value*scales[from]/scales[to]}
const number='([+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?)';
export function deriveGrrUncertainty(certificateText:string,resolution:string,measurementUnit:string){
 const d=Number(resolution);if(!resolution.trim()||!Number.isFinite(d)||d<=0)throw Error('선택한 계측기 대장에 최소 눈금 정보가 없습니다. 계측기 등록 정보를 확인하세요.');
 const display=d/Math.sqrt(12);
 if(!certificateText.trim())return {sources:[{name:'계측기 최소 눈금에서 자동 환산',standardUncertainty:display}],certificate:null,display,combined:display,expanded:null,k:null,sourceUnit:measurementUnit,partial:true};
 const factor=certificateText.match(new RegExp('(?:\\bk|포함\\s*인자|coverage\\s*factor)\\s*[=:：]?\\s*'+number,'i'));
 if(!factor)throw Error('붙여넣은 문장에서 성적서의 배수 정보를 찾지 못했습니다. 불확실도 설명 문장을 끝까지 복사하거나 교정기관에 확인하세요. 앱이 2로 임의 지정하지 않습니다.');
 const value=certificateText.match(new RegExp('(?:확장\\s*불확실도|측정\\s*불확실도|불확실도|expanded\\s*uncertainty|\\bU\\b)\\s*(?:U\\s*)?[=:：]?\\s*(?:±|\\+/-)?\\s*'+number+'\\s*([a-zA-Zμµ°℃㎛%]+)?','i'));
 if(!value)throw Error('불확실도 숫자를 찾지 못했습니다. 예시처럼 불확실도 값·단위가 포함된 문장을 복사하세요. 식이나 측정값별 표는 해당 측정점의 결과를 확인해야 합니다.');
 const expanded=Number(value[1]),k=Number(factor[1]),sourceUnit=value[2]||'';
 if(!sourceUnit)throw Error('붙여넣은 문장에 불확실도 단위가 없습니다. 성적서에 적힌 단위까지 포함해 복사하세요.');
 if(sourceUnit==='%')throw Error('백분율로 적힌 불확실도는 현재 자동 환산 대상이 아닙니다. 교정기관에 해당 측정점의 단위값을 확인하세요.');
 if(!Number.isFinite(expanded)||expanded<0||!Number.isFinite(k)||k<=0)throw Error('성적서의 불확실도 숫자와 배수 정보를 확인하세요.');
 const certificate=convert(expanded,sourceUnit,measurementUnit)/k;
 const sources:UncertaintySource[]=[{name:'교정성적서에서 자동 환산',standardUncertainty:certificate},{name:'계측기 최소 눈금에서 자동 환산',standardUncertainty:display}];
 return {sources,certificate,display,combined:Math.hypot(certificate,display),expanded,k,sourceUnit,partial:false};
}
