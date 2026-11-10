"use client";
import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export default function Barcode({value}:{value:string}) {
  const ref=useRef<SVGSVGElement>(null);
  useEffect(()=>{if(ref.current) JsBarcode(ref.current,value,{format:"CODE128",displayValue:false,margin:3,height:52,width:1.5,background:"#ffffff",lineColor:"#102f51"});},[value]);
  return <svg className="barcode-svg" ref={ref} aria-label={`바코드 ${value}`}/>;
}
