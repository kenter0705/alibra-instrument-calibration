# CALIBRA 개인용 · 다인·교육용

두 앱은 별도로 설치·실행합니다. 개인용의 원본 자료와 계정은 다인용으로 자동 복사하지 않습니다.

| 앱 | 공개 버전 | 기본 포트 | 설치·자료 폴더 이름 | 소스 브랜치 |
| --- | --- | --- | --- | --- |
| 개인용 | [v0.1.4](https://github.com/kenter0705/alibra-instrument-calibration/releases/tag/v0.1.4) | 3000 | CALIBRA | [codex/personal](https://github.com/kenter0705/alibra-instrument-calibration/tree/codex/personal) |
| 다인·교육용 | [v0.2.0](https://github.com/kenter0705/alibra-instrument-calibration/releases/tag/classroom-v0.2.0) | 4000 | CALIBRA-Classroom | [codex/classroom](https://github.com/kenter0705/alibra-instrument-calibration/tree/codex/classroom) |

각 릴리스의 해당 앱 **Setup ZIP**을 내려받아 압축을 풀고 SETUP.exe를 실행하세요. 같은 종류 앱의 업데이트 설치는 기존 DB·계정·첨부 자료를 보존합니다. 새 설치에서는 설치 PC에서 첫 관리자 계정을 직접 등록합니다. 기존 계정은 그대로 사용합니다.

앱 종류·버전·빌드 번호가 일치할 때만 실행하며 구버전이나 다른 포트로 자동 우회하지 않습니다. 앱 안의 Windows 다운로드도 해당 앱 종류와 버전으로 고정됩니다. 두 종류 앱은 같은 PC에서 함께 실행할 수 있습니다.

다인용은 관리자 로그인 후 ‘다수 사용하기’에서 공유 설정을 저장하고 **다인용 바로가기를 다시 실행**합니다. 교육생은 서버 IP:4000으로 접속합니다. IP만 입력하면 4000번 포트를 사용합니다. 합성 계정 25개의 HTTP 로그인·공동 자료 읽기·동시 사본 저장 시험을 통과했습니다. 실제 교실의 네트워크와 방화벽 접속은 수업 전에 확인하세요. DB 파일을 공유 폴더에서 여러 PC가 직접 열지 않습니다.

두 앱 모두 게시글 Excel/PDF 개별·선택·일괄 내려받기와 원본 보존·불러오기·사본 수정·다른 이름 저장을 제공합니다. 변환 대상은 등록된 게시글 내용입니다. 공개 설치 ZIP에는 사용자 DB·인증 키·업로드 원본 자료를 포함하지 않습니다.

[공개 다운로드](https://kenter0705.github.io/alibra-instrument-calibration/) · [다인용 사용 안내](docs/classroom.html) · [두 앱 구분](docs/editions.md)

개발·재배포 시 해당 브랜치의 `calibraEdition`과 버전을 유지하고 `installer/build-edition-package.ps1 -SourceRoot <검증된 빌드 폴더>`를 사용합니다. 예전 단일 앱용 설치·업데이트 스크립트는 이번 두 앱 배포에 사용하지 않습니다. 기본 main은 다인용 소스와 공개 안내를 담으며, 개인용 소스는 codex/personal에서 관리합니다.
