import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeft,
  ExternalLink,
  Github,
  MonitorDown,
  Smartphone,
} from "lucide-react";
import HomeShareLink from "@/components/home-share-link";
import DownloadHelpTabs from "@/components/download-help-tabs";

export default function DownloadsPage() {
  return (
    <main className="record-page">
      <header className="record-top">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} /> 홈으로
        </Link>
      </header>
      <section className="record-content">
        <div className="page-heading">
          <div>
            <span className="eyebrow">CALIBRA · OFFLINE PACKAGES</span>
            <h1>설치 파일 다운로드</h1>
            <p>Windows 독립 실행 패키지와 휴대폰 홈 화면 설치 자료를 제공합니다.</p>
          </div>
        </div>

        <HomeShareLink />

        <DownloadHelpTabs
          downloadContent={<>
        <div className="download-grid">
          <article className="panel download-card">
            <MonitorDown size={24} />
            <h2>Windows 설치 ZIP</h2>
            <p>
              CALIBRA Windows 설치 패키지입니다. 압축을 풀고 <b>SETUP.exe</b> 하나만 실행하면
              설치와 바탕화면 바로가기 생성이 진행되고 홈 화면을 엽니다.
            </p>
            <a className="primary-button" href="/api/download/windows">
              <ArrowDownToLine size={16} /> Windows 설치 ZIP 받기 · 최신 버전
            </a>
          </article>
          <article className="panel download-card">
            <Smartphone size={24} />
            <h2>모바일 설치 ZIP</h2>
            <p>
              휴대폰 홈 화면에 추가하는 PWA 안내와 설정 파일입니다. PC 앱이 실행 중이고 PC와 휴대폰이
              같은 Wi-Fi에 연결되어 있어야 합니다.
            </p>
            <a className="primary-button" href="/api/download/mobile">
              <ArrowDownToLine size={16} /> 모바일 ZIP 받기
            </a>
          </article>
        </div>

        <section className="panel download-github">
          <div className="download-github-copy">
            <span className="eyebrow">FREE GITHUB REPOSITORY</span>
            <h2>앱 소스코드 저장소</h2>
            <p>
              앱 소스코드 저장소입니다. 이 주소는 실행 홈 화면이 아니며, 앱 배포는 Windows 설치 ZIP을
              이용하세요. 현재 설치 ZIP은 버전별로 제공됩니다.
            </p>
          </div>
          <a
            className="secondary-button download-github-link"
            href="https://github.com/kenter0705/alibra-instrument-calibration"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={16} /> 계측기 앱 GitHub 저장소 <ExternalLink size={14} />
          </a>
        </section>

        <div className="standard-note">
          <b>데이터 보존과 업데이트</b>
          <span>
            설치·업데이트는 앱 파일만 교체하고 사용자 데이터베이스와 첨부 자료를 덮어쓰지 않습니다.
            앱과 데이터는 설치한 PC에 저장됩니다. 업데이트 설치는 사용자 데이터 폴더를 덮어쓰지 않습니다.
          </span>
        </div>
          </>}
          manualContent={<section className="panel user-manual">
            <span className="eyebrow">CALIBRA · 사용자 안내</span>
            <h2>설치형 프로그램 사용 설명서</h2>
            <p className="manual-lead">공개 웹에서는 CALIBRA 소개와 미리보기를 확인하고, 설치 파일은 계정 로그인 후 내려받습니다. 설치한 뒤에도 승인된 이메일 계정으로 로그인해야 업무 화면을 사용할 수 있습니다. 실제 등록 자료와 분석 결과는 프로그램을 설치해 실행하는 PC에 저장됩니다.</p>

            <div className="manual-warning"><strong>여러 명이 동시에 사용할 때</strong><span>현재 설치형 버전은 PC 한 대에서 사용하는 SQLite 방식입니다. 여러 PC가 공용 폴더의 SQLite 파일을 함께 열면 잠금 충돌과 데이터 손상이 생길 수 있습니다. 공용 폴더에 DB 파일을 놓지 마세요. 동시 사용은 중앙 서버와 PostgreSQL을 연결한 다중 사용자 버전이 준비된 뒤 사용해야 합니다.</span></div>

            <div className="manual-grid">
              <article><h3>1. 공개 웹에서 설치 후 첫 실행</h3><ol><li>공개 웹은 소개와 미리보기용입니다. 둘러보기는 로그인 없이 할 수 있습니다.</li><li>설치 파일 다운로드는 계정 로그인 후 이용합니다. 이메일 가입·승인 절차가 제공되는 배포 웹에서 계정을 승인받으세요.</li><li>Windows ZIP 전체를 다운로드한 뒤 PC의 로컬 폴더에 압축을 풉니다.</li><li>압축을 푼 폴더에서 <b>SETUP.exe</b>를 실행하고, 설치 완료 후 바탕화면 CALIBRA 바로가기로 실행합니다.</li><li>업무 기능을 열 때 승인된 이메일 계정으로 로그인합니다. <code>localhost</code> 주소는 설치한 현재 PC에서만 열립니다.</li></ol></article>
              <article><h3>2. 데이터 저장과 보존</h3><ul><li>계측기, 검교정 이력, 분석 및 교재 정보는 설치 PC의 로컬 저장소에 보관됩니다.</li><li>업데이트 전에 앱을 정상 종료하고, 중요한 자료는 데이터 백업 화면에서 별도 위치에 복사해 두세요.</li><li>업데이트는 앱 파일을 교체하는 작업입니다. 설치 프로그램이 보존하도록 설계되어 있어도 백업 사본은 별도로 유지하세요.</li><li>백업 ZIP과 원본 데이터베이스를 같은 폴더에만 보관하지 말고 다른 드라이브에도 복사하세요.</li></ul></article>
              <article><h3>3. 업데이트 방법</h3><ol><li>현재 프로그램을 종료합니다.</li><li>새 버전 ZIP을 다운로드해 새 폴더에 압축을 풉니다.</li><li>새 폴더의 SETUP.exe를 실행해 업데이트합니다.</li><li>실행 후 계측기 목록과 최근 이력을 확인합니다. 문제가 있으면 앱을 종료하고 백업 DB를 복사해 복구한 다음 지원 로그를 보관하세요.</li></ol></article>
              <article><h3>4. 자주 발생하는 문제</h3><dl><dt>앱이 열리지 않거나 “포트를 이미 사용 중”이라고 나옵니다</dt><dd>이전 CALIBRA 창이 백그라운드에 남아 있을 수 있습니다. 작업 관리자에서 CALIBRA/Node 실행을 종료한 뒤 바로가기를 다시 실행하세요. 다른 프로그램이 포트를 쓰고 있다면 해당 프로그램을 종료해야 합니다.</dd><dt>브라우저에서 localhost 연결 거부가 표시됩니다</dt><dd>앱 서버가 실행되지 않은 상태입니다. 바탕화면 바로가기로 다시 실행하고, 실행 오류 창의 안내 로그를 확인하세요. localhost는 다른 PC에서 접속하는 공유 주소가 아닙니다.</dd><dt>화면이 하얗거나 오류 화면으로 바뀝니다</dt><dd>앱과 브라우저가 서로 다른 버전일 수 있습니다. 앱을 완전히 종료하고 새 버전을 다시 실행한 뒤 브라우저에서 Ctrl+F5를 누르세요.</dd><dt>다운로드가 오래 걸리거나 ZIP이 열리지 않습니다</dt><dd>다운로드가 끝날 때까지 기다린 뒤 파일 크기를 확인하고 다시 압축을 풀어 보세요. ZIP 내부 파일만 일부 복사하면 설치가 되지 않습니다.</dd></dl></article>
            </div>
            <p className="manual-footnote">본 안내는 현재 개인 PC용 설치 구조를 설명합니다. 회사 다중 사용자 운영, 공용 데이터 동기화 및 법적 전자서명은 별도 서버 구성과 검증이 완료되기 전까지 지원된다고 간주하지 마세요.</p>
          </section>}
        />
      </section>
    </main>
  );
}

