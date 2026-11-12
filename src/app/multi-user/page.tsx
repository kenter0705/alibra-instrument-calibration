import Link from "next/link";
import MultiUserSettings from "@/components/multi-user-settings";
import { IS_CLASSROOM } from "@/lib/app-edition";

export default function MultiUserPage() {
  if (!IS_CLASSROOM) return <main className="record-page"><section className="record-content"><h1>CALIBRA 개인용</h1><p>이 앱은 개인용입니다. 다인·교육용은 별도 설치 파일과 자료 공간을 사용합니다.</p><Link href="/" className="secondary-button">개인용 홈으로</Link></section></main>;
  return <main className="record-page"><header className="record-top"><Link href="/" className="back-link">← 홈으로</Link><Link href="/login" className="secondary-button">로그인</Link></header><section className="record-content"><div className="page-heading"><div><span className="eyebrow">SHARED WORKSPACE</span><h1>다수 사용하기</h1><p>설치한 PC 한 대를 서버로 정하고, 다른 PC와 휴대폰은 그 서버에 접속합니다.</p></div></div><MultiUserSettings/><section className="panel network-help"><h2>사용 순서</h2><ol><li>서버 PC에서 관리자 로그인 후 아래 공유 서버 설정을 켜고 저장합니다.</li><li>서버 PC의 CALIBRA 바로가기를 다시 실행합니다. 서버 PC는 사용 중 켜 두세요.</li><li>다른 PC에서 서버 IP와 포트를 입력하고 ‘저장하고 새로고침’을 누릅니다. 휴대폰은 같은 Wi-Fi에서 표시된 접속 주소를 엽니다.</li><li>서버에 등록·승인된 각자의 계정으로 로그인합니다. 모든 업무 자료와 첨부파일은 서버 PC에 저장됩니다.</li></ol><p>같은 사내망에서 소규모로 함께 사용하는 방식입니다. 같은 기록을 동시에 수정하면 나중 저장이 반영될 수 있으니 담당자를 정해 작업하세요. 여러 PC에서 공유 폴더의 DB 파일을 직접 열지 마세요.</p><p>연결이 안 되면 IP·포트, 서버 실행 여부, 같은 네트워크인지 확인하세요. Windows 방화벽은 관리자에게 해당 사설망에서 CALIBRA 포트만 허용하도록 요청하세요. 외부 인터넷에는 포트 포워딩하지 마세요.</p><Link href="/downloads#multi-user-guide" className="secondary-button">사용 설명서 보기</Link></section></section></main>;
}
