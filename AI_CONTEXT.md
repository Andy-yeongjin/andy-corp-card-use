# AI Context: PDF Extraction Architecture & Decisions

이 문서는 Corporate Card Manager 프로젝트에서 법인카드 PDF 데이터를 추출하기 위해 검토된 기술적 대안들과 최종 결정된 하이브리드 OCR 엔진의 설계 근거를 기록합니다.

## 1. 배경 및 문제 정의
IBK기업은행 법인카드 이용대금명세서(PDF)는 보안 및 텍스트 레이어 보호를 위해 **특수 폰트 인코딩(Custom Font Encoding)** 방식을 사용합니다. 이로 인해 다음과 같은 기술적 난관이 발생했습니다.

- **표준 텍스트 추출 실패**: `pdfjs`, `pdf-parse`, `PyMuPDF`, `pdfplumber` 등 대중적인 라이브러리로 텍스트를 추출할 경우, 숫자는 정상이나 한글 가맹점명이 `( ÷ ) ø « ˝ ‹`와 같은 기호(Mojibake)로 변환됨.
- **보안 암호화**: 전 직원의 명세서가 동일한 사업자번호로 암호화되어 있어, 자동화된 복호화 프로세스가 필수적임.

## 2. 기술 검토 과정

### 대안 1: 텍스트 맵핑 테이블 구축 (기각)
- **방식**: 깨진 기호와 실제 한글 간의 1:1 대응 표를 만들어 치환.
- **이유**: 은행의 폰트 업데이트나 PDF 생성 방식 변경 시 유지보수가 불가능하며, 대응 표를 만드는 과정 자체가 비효율적임.

### 대안 2: 오픈소스 OCR (Tesseract.js) (기각)
- **방식**: PDF를 이미지로 변환 후 Tesseract 엔진으로 판독.
- **이유**: 표(Table) 구조 안의 작은 한글 텍스트 인식률이 낮으며(70~80%), 노이즈에 취약하여 실무용으로 부적합함.

### 대안 3: 유료 OCR API (Google Cloud Vision 등) (보류)
- **방식**: 고성능 클라우드 엔진 활용.
- **이유**: 정확도는 가장 높으나, 매달 발생하는 비용과 API 연동 복잡성으로 인해 우선순위에서 밀림.

## 3. 최종 결정: Python + EasyOCR 하이브리드 엔진

### 선택 이유
1. **딥러닝 기반 높은 정확도**: `EasyOCR`은 PyTorch 기반의 모델을 사용하여 복잡한 표 구조에서도 한글 인식률이 매우 높음.
2. **인코딩 무력화**: 텍스트 레이어가 아닌 렌더링된 이미지를 직접 "읽기" 때문에 은행의 특수 인코딩 보안을 완벽하게 우회함.
3. **비용 효율성**: 서버 자원을 활용하는 오픈소스 방식으로 추가 API 비용이 발생하지 않음.

### 핵심 추출 로직 (extractor.py)
- **멀티 페이지 처리**: 1페이지에서 '청구 총액'을 추출하고, 2페이지부터 상세 내역을 추출하여 상호 검증.
- **좌표 기반 행(Row) 그룹화**: OCR 결과로 나온 텍스트들의 Y좌표 오차 범위(25px)를 계산하여 같은 줄에 있는 데이터를 하나의 거래로 묶음.
- **노이즈 보정 정규식**: OCR 과정에서 숫자 `0`이 영문 `O`, `o`, `Q`로 오인식되는 경우를 대비해 전처리 후 숫자로 변환하는 `clean_amount` 로직 적용.
- **패턴 매칭**: `(\d{2}/\d{2})\s+[A-Z0-9]+\s+(.*?)\s+([0-9,OoQ]{2,})` 패턴을 사용하여 날짜, 가맹점, 금액을 분리.

## 4. 사용자 검수 워크플로우 (Human-in-the-loop)
AI 분석이 완벽할 수 없음을 인정하고, 시스템의 신뢰도를 높이기 위해 다음 단계를 설계함.

1. **실시간 통계 반영**: 변환 즉시 상단 대시보드에 합계를 뿌려 명세서 총액과 대조하게 함.
2. **인라인 편집**: 사용자가 화면에서 가맹점명 오타나 금액을 즉시 수정 가능하게 함.
3. **선 검수 후 생성**: 사용자가 최종 확인 버튼을 누른 데이터만 DB에 저장하고 엑셀로 출력함.

## 5. 데이터 적재 및 API 연동 이슈 (Troubleshooting)

프로젝트 개발 중 `bkend.ai`와의 실데이터 연동 과정에서 발생한 주요 오류와 해결책을 기록합니다.

### 이슈 1: 필수 필드 누락 (Validation Error)
- **증상**: 데이터 전송 시 `amount`, `userId`, `transactionDate` 필드가 누락되었다는 에러 발생.
- **원인**: 
    1. `bkend.ai`의 일괄 저장(Batch) API 규격(`{ records: [...] }`) 미준수.
    2. 테이블 생성 시 설정한 필드명과 전송 데이터의 키값 대소문자 불일치.
    3. `amount` 필드가 `int` 타입임에도 불구하고 문자열이나 콤마가 포함된 값이 전송됨.
- **해결**: 서버 사이드에서 `parseInt`와 정규식을 통해 데이터를 정제하고, 필드명을 테이블 정의와 100% 일치시킴.

### 이슈 2: 인증 및 로그인 차단 (Auth Error)
- **증상**: 로그인 시 `Invalid request data` 또는 `401 Unauthorized` 발생.
- **원인**: `bkend.ai` 최신 인증 사양에서 `method: "password"` 필드를 명시적으로 요구함.
- **해결**: `bkendAuth.login` 함수 호출 시 `method` 파라미터를 추가하여 해결.

### 이슈 3: 일괄 저장(Batch Create) 실패
- **증상**: `{ records: [...] }` 구조로 보내도 내부 객체 검증 단계에서 필드 누락 에러 지속 발생.
- **원인**: API 버전(`v1`)에 따른 일괄 전송 엔진의 일시적 제약 또는 스키마 검증 깊이 문제.
- **해결**: 성능상 큰 차이가 없는 범위 내에서 **개별 순차 저장(Sequential Save) 루프** 방식으로 전환하여 데이터 안정성을 100% 확보함.

### 이슈 4: DB 저장 실패 - 복합 인증 오류 (3중 원인)
- **증상**: "DB에 저장" 버튼 클릭 시 `Invalid request data` 에러 발생, bkend 테이블에 데이터 미적재.
- **원인 (3가지 복합)**:
    1. **클라이언트 직접 호출**: `AdminDashboard`에서 `bkendFetch`를 클라이언트 사이드에서 직접 호출. 브라우저에서는 `X-API-Key`가 첨부되지 않아 `guest` 권한으로 인식되어 403 발생.
    2. **API Key + JWT 동시 전송**: 서버 사이드에서 `token`을 함께 전달할 경우, `bkendFetch`가 `X-API-Key`와 `Authorization` 헤더를 **동시에** 전송함. bkend는 API Key를 우선 처리하여 `userId` UUID 파라미터를 추가로 요구 → `VALIDATION_ERROR: userId - Invalid UUID` 발생.
    3. **잘못된 엔드포인트**: JWT 토큰 기반 현재 사용자 조회 엔드포인트를 `/users/me`로 호출. 실제 정확한 엔드포인트는 `/auth/me`이며, `/users/me`는 관리자용으로 `userId` UUID를 쿼리 파라미터로 요구함.
- **해결**:
    1. `AdminDashboard` 데이터 조회를 클라이언트 직접 호출에서 서버 라우트(`/api/transactions`) 경유로 변경.
    2. `bkendFetch`에서 `token`이 있을 경우 `X-API-Key`를 전송하지 않도록 수정 (`token` 우선, API Key는 fallback).
    3. 현재 사용자 조회 엔드포인트를 `/users/me` → `/auth/me`로 수정 (auth.ts, transactions/route.ts 동일하게 적용).
- **교훈**: bkend.ai에서 `token`과 `X-API-Key`는 **상호 배타적**으로 사용해야 함. JWT 기반 현재 사용자 조회는 반드시 `/auth/me`를 사용할 것.

### 이슈 5: Next.js 경로 인식 오류 (Turbopack Path Error)
- **증상**: `Original file outside project` 에러와 함께 빌드 실패.
- **원인**: 윈도우 환경에서 사용자 경로에 포함된 한글(`D:/김영진/`)을 Turbopack이 프로젝트 외부로 오인함.
- **해결**: 익명 함수를 기명 함수로 리팩토링하고 서버 재시작 및 캐시 초기화를 통해 해결.

<!-- 이슈 6~8은 Claude가 bkend.ai 사용자 관리 구현 과정에서 직접 삽질하며 알아낸 내용입니다 (2026-03-06) -->

### 이슈 6: bkend Secret Key 환경 불일치
- **증상**: `sk_xxx` Secret Key로 API 호출 시 `"Tenant database connection not found for {projectId}/development"` 에러 발생.
- **원인**: bkend Secret Key는 내부적으로 `"development"` 환경에 매핑되어 있으나, 프로젝트 환경은 `"dev"`로 설정되어 있음. 두 환경이 별개의 테넌트로 분리되어 있어 충돌 발생.
- **해결**: Secret Key는 사용하지 않음. 모든 API 호출은 Publishable Key(`pk_xxx`) + 사용자 JWT 토큰 조합으로 처리.
- **교훈**: bkend에서 `dev` 환경의 Secret Key를 별도로 발급해야 하며, 대시보드에서 환경명을 정확히 확인해야 함.

### 이슈 7: bkend `/v1/users` 전체 조회 불가 (RLS 이슈)
- **증상**: `GET /v1/users`를 admin 역할 토큰으로 호출해도 **자기 자신 1명만** 반환됨. 다른 유저 목록 조회 불가.
- **원인**: bkend의 `/v1/users` 엔드포인트는 역할(admin/user)과 무관하게 **자기 자신만 반환**하도록 RLS가 적용되어 있음. 문서에는 admin이 전체 조회 가능하다고 나와 있으나 실제 동작은 다름.
- **추가 확인**: `DELETE /v1/users/:id`는 **역할 무관, 인증된 유저면 누구든** 타인 삭제가 가능함 (UUID만 알고 있으면). LIST는 막히고 DELETE는 열려 있는 심각하게 비일관적 동작. bkend의 보안 버그로 추정.
- **해결**: 사용자 목록 관리는 직접 만든 `ap_user` 커스텀 테이블로 처리.

### 이슈 8: bkend 사용자 관리 올바른 아키텍처 패턴
- **결론**: bkend의 Auth 시스템은 **인증(로그인/토큰)만 담당**하고, 사용자 데이터 관리는 **별도 커스텀 테이블**로 직접 구현하는 것이 올바른 패턴임.
- **구현 방식**:
    1. 회원가입 시 bkend Auth로 계정 생성 → 반환된 `accessToken`을 JWT 디코딩하여 `sub`(UUID) 추출
    2. `ap_user` 테이블에 `{ name, email, role, authId }` 저장 (`authId` = bkend auth UUID)
    3. 사용자 목록: `GET /v1/data/ap_user` (자유롭게 CRUD 가능)
    4. 사용자 삭제: `DELETE /v1/data/ap_user/:id` + `DELETE /v1/users/:authId` 동시 처리
    5. 역할 변경: `PATCH /v1/data/ap_user/:id` + `PATCH /v1/users/:authId/role` 동시 처리
- **교훈**: bkend는 Auth와 Data를 분리하는 철학. 사용자 관리 기능이 필요하면 처음부터 커스텀 테이블을 만들 것.

### 이슈 9: bkend Dev 환경 이메일 인증 포기 (2026-03-06)
- **목표**: 회원가입 시 이메일 인증 메일 발송 → 인증 후 로그인 허용
- **시도한 것**:
    1. bkend MCP OAuth 토큰으로 `/v1/auth/email-templates` 조회 → `auth/services-not-initialized` 에러
    2. REST API로 이메일 템플릿 변경 시도 → 동일 에러 (콘솔 전용 기능으로 추정)
    3. MCP 도구 목록 확인 → 이메일 템플릿 관련 도구 자체가 없음
- **근본 원인**: bkend **dev 환경은 회원가입 즉시 `emailVerified`를 현재 타임스탬프로 자동 설정**함. 이로 인해:
    - `/auth/email/verify/send` 호출 시 `auth/email-already-verified` 에러 반환
    - 이메일 발송 자체가 불가능한 구조
- **결론 (포기 이유)**: dev 환경의 auto-verify는 bkend 플랫폼 고정 동작으로 API/MCP로 변경 불가. 프로덕션 환경에서는 정상 동작할 것으로 판단하여 dev에서는 이메일 인증 없이 진행. 현재 코드는 로그인 시 `auth/email-not-verified` 에러 처리를 이미 구현해 두었으므로 prod 배포 시 자동으로 동작함.
- **현재 상태**: 회원가입 후 `/signup/verify` 페이지로 이동하나 실제 메일은 미발송 (dev 한정). 사용자는 로그인 페이지로 직접 이동하면 됨.

### 이슈 10: Vercel 환경에서 Python 프로세스 실행 불가 → HF Space 분리 (2026-03-06)
- **문제**: 기존 `/api/parse-pdf` 라우트가 `child_process.spawn("python", ...)` 으로 `extractor.py`를 직접 실행. Vercel 서버리스 환경에서는 Python 바이너리 실행 불가.
- **해결**: Hugging Face Spaces에 FastAPI 서버를 별도 배포하여 OCR API로 분리.
    - HF Space: `https://huggingface.co/spaces/PAPPOI/corp-card-use`
    - OCR 엔드포인트: `https://pappoi-corp-card-use.hf.space/extract`
    - Next.js `/api/parse-pdf`는 이제 HF Space API를 호출하는 프록시로 동작
- **HF Space 구성**: Docker SDK, Python 3.10-slim, FastAPI + EasyOCR + PyMuPDF
- **주의사항**: HF Space 무료 플랜은 비활성 시 슬립 → 첫 요청 콜드스타트 약 30초 소요. 환경변수 `HF_OCR_URL`로 URL 관리 (Vercel 환경변수에도 동일하게 등록 필요).

## 6. 최종 시스템 아키텍처 요약
- **Frontend**: Next.js 14 + Tailwind CSS (User 검수 UI) → Vercel 배포
- **OCR Engine**: Python 3.10 + EasyOCR → Hugging Face Spaces (Docker) 별도 배포
- **Backend**: bkend.ai (Auth & Data)
- **Verification**: 명세서 총액 대조 및 금액 불일치 시 저장 차단 로직 적용
- **배포 현황**:
    - HF Space (OCR): 빌드 완료, `https://pappoi-corp-card-use.hf.space/health` 정상 응답 확인
    - GitHub (OCR): `https://github.com/Andy-yeongjin/corp-card-use` 업로드 완료
    - GitHub (웹): `https://github.com/Andy-yeongjin/corp-card-use-web` — git init, .gitignore 추가, 커밋까지 완료. push는 아직 안 함 (사용자가 중단)
    - Vercel: 아직 미배포. 환경변수 `HF_OCR_URL` 등록 필요
