"use client";
import { Printer } from "lucide-react";
export default function PrintButton({label="인쇄",icon=false}:{label?:string;icon?:boolean}) {
  return <button className="secondary-button no-print" onClick={()=>window.print()}>{icon&&<Printer size={15} />}{label}</button>;
}
