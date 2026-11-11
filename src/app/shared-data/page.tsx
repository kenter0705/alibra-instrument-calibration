import Link from "next/link";
import SharedDataWorkspace from "@/components/shared-data-workspace";
export default function SharedDataPage() {
  return <main className="record-page"><header className="record-top"><Link href="/" className="back-link">← 홈으로</Link><Link href="/multi-user" className="secondary-button">다수 사용하기 · IP 설정</Link></header><section className="record-content"><div className="page-heading"><div><span className="eyebrow">SHARED TRAINING DATA</span><h1>공동 데이터실</h1><p>같은 서버의 자료를 함께 불러오고, 원본을 보존하며 수정 사본을 새 이름으로 저장합니다.</p></div></div><SharedDataWorkspace/></section></main>;
}
