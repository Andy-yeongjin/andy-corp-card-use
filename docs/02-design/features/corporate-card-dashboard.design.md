# Corporate Card Dashboard Design Document

> Version: 1.0.0 | Created: 2026-03-06 | Status: Draft

## 1. Overview
이 문서는 사내 법인카드 사용 내역(PDF)을 업로드하여 엑셀로 자동 변환하고, 관리자가 대시보드에서 통합 관리할 수 있도록 하는 시스템의 설계서입니다. Next.js 14(App Router) 기반의 프론트엔드와 bkend.ai(BaaS)를 활용하여 구축됩니다.

## 2. Architecture
### System Diagram
- **Frontend (Next.js)**: Dashboard UI, PDF Upload Interface, Authentication Flow
- **Backend (bkend.ai)**: Auth (RBAC), Data (Transactions DB), Storage (PDF & Excel Files)
- **Core Modules**: 
  - `pdfParser`: PDF 텍스트 추출 및 정형 데이터 변환 모듈
  - `excelGenerator`: 사내 표준 양식 엑셀 파일 생성 모듈

### Components
- `UploadForm`: PDF 파일 업로드, 파싱 진행 상태 표시.
- `AdminDashboard`: 부서별/개인별 사용 통계, 전체 거래 내역 필터링 및 조회.
- `UserDashboard`: 본인 사용 내역 조회 및 상태 확인.
- `AuthGuard`: Role-Based Access Control (Admin/User) 라우트 보호.

## 3. Data Model
### Entities
```typescript
interface CardTransaction {
  id: string;                 // bkend.ai Document ID
  userId: string;             // 업로드한 사용자 ID
  department: string;         // 소속 부서
  transactionDate: string;    // 승인 날짜 (YYYY-MM-DD)
  merchantName: string;       // 가맹점명
  amount: number;             // 결제 금액
  approvalNumber: string;     // 승인 번호
  pdfFileId: string;          // 원본 PDF 파일 Storage ID
  status: 'parsed' | 'error'; // 파싱 상태
  createdAt: string;          // 생성 일시
}

interface UserProfile {
  id: string;                 // bkend.ai Auth ID
  email: string;
  name: string;
  department: string;
  role: 'admin' | 'user';     // 권한
}
```

## 4. API Specification
백엔드는 bkend.ai의 Data, Storage API를 활용합니다.
### Endpoints (bkend.ai Actions)
| Method | Path/Action | Description |
|--------|-------------|-------------|
| POST | Storage/upload | 카드 내역 PDF 파일 업로드 |
| POST | Data/transactions | 파싱된 카드 내역 데이터를 DB에 일괄 저장 |
| GET | Data/transactions | 대시보드 거래 내역 조회 (필터링, 정렬, RLS 적용) |
| GET | Data/transactions/stats | 대시보드용 부서별/사용자별 사용 통계 조회 |
| GET | Storage/download | 변환된 Excel 파일 다운로드 |

## 5. UI Design
- **Login View**: 이메일 기반 인증 (bkend.ai Auth).
- **User View (직원)**: PDF 드래그 앤 드롭 업로드 영역, 최근 업로드 및 변환 내역 목록.
- **Admin View (관리자)**: 상단 통계 위젯(총 사용액, 부서별 파이 차트), 하단 전체 내역 데이터 그리드, 엑셀 일괄 다운로드 버튼.
- **Styling**: Vanilla CSS를 활용한 Clean & Enterprise Look 구현.

## 6. Test Plan
| Test Case | Expected Result |
|-----------|-----------------|
| 정상 PDF 업로드 및 파싱 | 파싱 성공률 99% 이상 및 5초 이내 Excel 변환 완료 |
| 비정상 파일 업로드 예외 처리 | 유효하지 않은 파일 포맷 시 명확한 에러 메시지 출력 |
| 권한 분리 (RBAC) 검증 | 직원은 본인 내역만, 관리자는 전체 내역 접근 가능 확인 (bkend RLS) |
| 지정 엑셀 폼 일치 검증 | 생성된 Excel 파일이 회사 지정 양식 포맷과 100% 일치 |
