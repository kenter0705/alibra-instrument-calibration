import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TrainingMaterialsBoard from "@/components/training-materials-board";

export default function TrainingTheoryPage(){return <main className="record-page"><header className="record-top"><Link href="/training" className="back-link"><ArrowLeft size={16}/> 교육 관리</Link><Link href="/training/materials" className="secondary-button">교재 목록 게시판</Link></header><section className="record-content"><div className="page-heading"><div><span className="eyebrow">SPC TRAINING LIBRARY · THEORY</span><h1>교육 교재 · 이론 안내</h1><p>교육 이론 안내와 교재 등록 목록을 독립 화면으로 구분했습니다.</p></div></div><TrainingMaterialsBoard materials={[]} page={1} pageCount={1} total={0} q="" type="" date="" view="theory"/></section></main>}
