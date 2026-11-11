# 더씨앤엠 홈페이지 (www.creativemore.co.kr)

Render 정적 사이트로 배포하는 더씨앤엠 리뉴얼 홈페이지 저장소

## 구성

* `site/` 배포 폴더 (Render `staticPublishPath`)
  * `index.html` 홈, `about/` `atl/` `btl/` `work/` `contact/` 메뉴 페이지
  * `work/<프로젝트>/` 프로젝트 상세 26
  * `assets/` 이미지 · 영상 · 폰트(Pretendard) · `dc-lite.js`(페이지 동작 스크립트)
  * `404.html` `robots.txt` `sitemap.xml` 파비콘 · `company-profile.pdf`(회사소개서)
* `render.yaml` Render Blueprint 설정 (정적 사이트 · 도메인 · 캐시 헤더 · 기존 사이트 주소 리다이렉트)
* `contact-form/Code.gs` 문의 접수 메일 발송 스크립트 (Google Apps Script 웹 앱)

## 오픈 순서

1. GitHub 저장소 생성 (비공개 권장, 이름 예시 `creativemore-site`), 이 폴더 전체 업로드
2. Render 로그인 › New › Blueprint › 저장소 선택 › Apply
3. Render 결제수단 등록 (트래픽 한도 초과 시 사이트 중지 방지, 아래 비용 항목)
4. `https://creativemore-site.onrender.com` 에서 전체 화면 확인
5. 문의 폼 연결 (아래 순서), 연결 후 저장소에 반영
6. 도메인 연결 (아래 순서, 네임서버를 아임웹으로 되돌리기)
7. Render › Settings › Custom Domains › Verify, SSL 인증서 자동 발급 확인
8. 구글 서치 콘솔 · 네이버 서치어드바이저에 `https://www.creativemore.co.kr/sitemap.xml` 제출
9. 기존 업체 유지보수 · 호스팅 해지는 새 사이트 접속 · 인증서 · 회사 메일 수신 · 문의 접수 확인 후 마지막에

## 문의 폼 연결 (Google Apps Script)

방문자 메일앱 없이 홈페이지에서 바로 접수, `kwon@creativemore.co.kr` · `cha@creativemore.co.kr` 로 항목별 정리 메일 발송

1. 회사 구글 계정으로 [script.google.com](https://script.google.com) 접속 › 새 프로젝트
2. `contact-form/Code.gs` 내용 전체 붙여넣기 › 저장 (프로젝트 이름 예시 `더씨앤엠 홈페이지 문의`)
3. 상단 함수 목록에서 `testSend` 선택 › 실행 › 권한 승인 (메일 발송 권한)
4. kwon@ · cha@ 받은편지함에 `[홈페이지 문의] 더씨앤엠 · 테스트` 메일 도착 확인
   * '차단된 앱' 화면이 나오면: 관리 콘솔(admin.google.com) › 보안 › 액세스 및 데이터 관리 › API 관리 › 설정 › 내부 앱 › `내부 앱 신뢰` 체크 › 저장 후 다시 실행
5. 배포 › 새 배포 › 유형 `웹 앱` › 실행 계정 `나` › 액세스 권한 `모든 사용자` › 배포
6. 웹 앱 URL 복사 (`https://script.google.com/macros/s/…/exec` 형식)
7. `site/contact/index.html` 의 `<meta name="cnm-form-endpoint" content="">` 따옴표 안에 URL 입력 › 저장소 반영

* 연결 완료 (2026-11-03): kwon@ 계정 소유 프로젝트 '더씨앤엠 홈페이지 문의' 웹 앱 버전 3
* URL 입력 전에는 전송 버튼 누르면 메일 주소 안내 문구 표시 (접수 누락 방지)
* 받는 주소 변경 · 추가: `Code.gs` 상단 `TO` · `CC`
* 접수 기록 시트: 구글 시트 생성 후 주소의 ID를 `SHEET_ID` 에 입력
* 코드 수정 시: 배포 › 배포 관리 › 기존 배포 편집 › 버전 `새 버전` (URL 그대로 유지)
* 메일 회신 버튼 누르면 문의자에게 바로 답장 (Reply-To 설정)
* 스팸 방지: 숨김 입력칸, 같은 내용 2분 내 1회만 발송, 10분 30건 초과 시 일시 차단
* 발송 한도: 구글 워크스페이스 계정 하루 1,500건 (일반 Gmail 100건)
* `모든 사용자` 항목이 안 보이면 구글 워크스페이스 관리 콘솔의 Apps Script 공유 제한 확인

## 도메인 연결 (아임웹 구매 · 현재 네임서버 카페24)

* creativemore.co.kr: 2021년 아임웹에서 구매 (등록대행 가비아, 등록인 권진아), 도메인 연장 · 네임서버 관리는 아임웹 계정
* 2025년 4월 네임서버를 카페24로 변경, 기존 유지보수 업체(드림위드) 카페24 계정에 연결돼 있어 레코드 수정은 업체만 가능
* 권장: 아임웹에서 레코드 5개 등록 후 네임서버를 아임웹으로 되돌리기 (아임웹 채팅 상담으로도 요청 가능), 이후 업체 유지보수 해지

1. 아임웹 (도메인 구매 계정) 로그인 › 도메인 › creativemore.co.kr › 레코드 설정에 아래 5개 등록
2. 네임서버를 카페24에서 아임웹 기본 네임서버로 변경
3. 반영 대기 (보통 몇 시간, 최대 1~2일) › Render › Custom Domains › Verify
4. 새 사이트 · 회사 메일 수신 확인 후 업체에 유지보수 해지 통보 (해지 희망일 30일 전 통보 조건)

| 타입 | 호스트 | 값 | 비고 |
|---|---|---|---|
| A | `@` | `216.24.57.1` | Render |
| CNAME | `www` | `creativemore-site.onrender.com` | Render 서비스 주소 |
| MX | `@` | `SMTP.GOOGLE.COM` (우선순위 1) | 회사 메일, 필수 |
| TXT | `@` | `google-site-verification=gjRePwpFrpBhv34qd2IuQrKZFdwUSBtXkficMk63L7E` | 구글 워크스페이스 · 서치 콘솔 |
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` | 기존 SPF 2개 대체 |

* AAAA 레코드 만들지 않기 (Render 권장)
* 순서 주의: 네임서버를 옮기기 전에 업체가 카페24 연결을 먼저 끊으면 사이트 · 회사 메일 모두 중단
* 급하면 업체에 www CNAME · `@` A 두 값만 변경 요청 (MX · TXT 유지), 이 경우에도 해지 전 위 이전은 필요
* 현재 카페24(업체) 값 (참고): A `@` 183.110.224.225 · CNAME `*` creativemore.co.kr · MX SMTP.GOOGLE.COM · TXT 3 (구글 인증 · SPF 2)

## 비용 · 트래픽

* 정적 사이트 자체는 무료, 단 외부 전송 트래픽은 워크스페이스 공용 한도에 포함
* 한도 초과 시 결제수단이 있으면 GB당 과금, 없으면 무료 서비스(이 사이트 포함) 월말까지 중지
* 영상은 화면에 보일 때만 불러오도록 처리 (`dc-lite.js`), 이미지 · 영상은 1년 캐시

## 수정 · 재배포

* 캔버스(Claude Design)에서 내용 수정 › 내보내기 › 이 저장소에 커밋 › Render 자동 재배포
* 기존 사이트 주소(`/bbs/…` `/theme/…` 회사소개서 PDF 등)는 `render.yaml` 리다이렉트로 새 주소 연결
* 없는 주소는 `404.html` 표시
