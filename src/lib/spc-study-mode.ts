import type {ControlMode} from "@/lib/spc-control";
export function studyControlMode(chartType:string,dataType:string):ControlMode|null{
 const plain=chartType.normalize("NFKD").replace(/\p{M}/gu,"").normalize("NFC").toLowerCase().replace(/[^a-z0-9가-힣]/g,"");
 if(!/관리도|xbar|imr/.test(plain))return null;
 if(/imr/.test(plain))return "i-mr";
 if(/xbars|xs/.test(plain))return "xbar-s";
 if(/xbarr|xr/.test(plain))return "xbar-r";
 if(/np|pn/.test(plain))return "np";
 if(/p관리도/.test(plain))return "p";
 if(/c관리도/.test(plain))return "c";
 if(/u관리도/.test(plain))return "u";
 return dataType==="계수치"?"p":"xbar-r";
}
