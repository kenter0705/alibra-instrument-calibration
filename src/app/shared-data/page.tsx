import Link from "next/link";
import SharedDataWorkspace from "@/components/shared-data-workspace";
import { IS_CLASSROOM } from "@/lib/app-edition";
export default function SharedDataPage() {
  return <main className="record-page"><header className="record-top"><Link href="/" className="back-link">← 홈으로</Link>{IS_CLASSROOM&&<Link href="/multi-user" className="secondary-button">다수 사용하기 · IP 설정</Link>}<Link href="/exports?board=shared-data" className="secondary-button">Excel·PDF 내려받기</Link></header><section className="record-content"><div className="page-heading"><div><span className="eyebrow">{IS_CLASSROOM?"SHARED":"PERSONAL"} TRAINING DATA</span><h1>데이터 불러오기 · 다른 이름 저장</h1><p>{IS_CLASSROOM?"같은 서버의 자료를 함께 불러옵니다.":"이 퍼스널 앱에 저장한 자료를 불러옵니다."} 원본을 보존하며 수정 사본을 새 이름으로 저장합니다.</p></div></div><SharedDataWorkspace/></section></main>;
}
