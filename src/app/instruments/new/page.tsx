import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InstrumentForm from "@/components/instrument-form";

export default function NewInstrumentPage(){
  return <main className="record-page"><header className="record-top"><Link href="/instruments" className="back-link"><ArrowLeft size={16}/> 계측기 대장</Link></header><section className="form-page"><span className="eyebrow">ASSET MANAGEMENT</span><h1>계측기 등록</h1><p>회사의 검교정 대상 계측기를 개별 등록합니다. 저장 시 바코드와 QR 식별값을 자동 발급합니다.</p><InstrumentForm/></section></main>;
}
