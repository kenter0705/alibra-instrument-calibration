import Link from "next/link";
import SpcReferenceGuide from "@/components/spc-reference-guide";
import PrintButton from "@/components/print-button";
export default function SpcReferencePage(){return <main className="record-page"><header className="record-top"><Link href="/quality">← 통계적 공정관리</Link><PrintButton label="용어·계산식 인쇄 / PDF"/></header><section className="record-content"><h1>SPC 용어·계산식 · 6시그마</h1><p>기초 통계부터 체크시트·관리도·불량률·직행률·공정능력·MSA·6시그마까지, 기호와 적용 조건을 함께 확인합니다.</p><p><a className="secondary-button" href="/reference/SPC-용어-계산식.md" download>용어·계산식 설명서 내려받기</a></p><SpcReferenceGuide/></section></main>}
