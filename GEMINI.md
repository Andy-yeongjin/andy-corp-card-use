# Corporate Card Manager (사내법인카드 관리 대시보드)

이 프로젝트는 사내 법인카드 사용 내역(PDF)을 업로드하여 엑셀로 변환하고 관리자가 대시보드에서 통합 관리하는 시스템입니다.

## 🛠️ 핵심 기술 스택
- **Frontend**: Next.js 14+ (App Router)
- **Backend**: bkend.ai (BaaS) - Auth, Data, Storage 활용
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Clean & Enterprise Look)

## 📁 프로젝트 구조 규칙
- 모든 PDCA 문서는 `docs/` 폴더에 위치한다.
- UI 컴포넌트는 `src/components/`에, 비즈니스 로직은 `src/lib/`에 위치한다.
- bkend.ai 연동 관련 코드는 `src/lib/bkend/`에 집중한다.

## 📝 개발 가이드
- PDF 파싱 로직은 별도의 서비스 모듈로 분리하여 테스트 가능하게 만든다.
- 관리자와 일반 직원의 권한 분리(RBAC)를 설계 단계부터 고려한다.
- 엑셀 변환 시 회사에서 지정한 특정 양식을 엄격히 준수한다.
