# Corporate Card Dashboard Gap Analysis

> Version: 1.0.0 | Created: 2026-03-06

## Match Rate: 45%

## Gap Summary
| Category | Design | Implementation | Status |
|----------|--------|----------------|--------|
| Architecture | App Router, Modules | Directory structure and base modules created | ✅ Started |
| Data Model | CardTransaction, UserProfile | Types implemented in `src/types/index.ts` | ✅ Done |
| API Spec | bkend.ai Actions | `bkendFetch` client created, actual calls missing | ⚠️ Partial |
| UI - Admin | Stats, Grid, Export | Mock data based dashboard implemented | ⚠️ Partial |
| UI - User | Upload, My History | Placeholder in `page.tsx` | ❌ Pending |
| UI - Login | Email Auth | Not yet implemented | ❌ Pending |
| Core Logic | pdfParser, excelGenerator | Stubs (Mock) implemented | ⚠️ Partial |
| Security | AuthGuard, RBAC | Not yet implemented | ❌ Pending |

## Critical Gaps
1. **Mock Data Reliance**: 모든 데이터가 정적(Mock)으로 구성되어 있어 실제 bkend.ai 백엔드와의 동기화가 필요합니다.
2. **Missing UI Components**: `UploadForm`, `UserDashboard`, `LoginView` 등 주요 인터페이스가 부재합니다.
3. **Stubbed Core Logic**: PDF 파싱과 엑셀 생성 기능이 실제 동작하지 않는 상태입니다.
4. **Auth & Security**: 권한 기반 접근 제어(`AuthGuard`)가 구현되지 않았습니다.

## Recommendations
1. **UploadForm 구현**: 파일 선택 및 업로드 진행 상태를 보여주는 컴포넌트를 우선 개발합니다.
2. **bkend.ai 실데이터 연동**: `AdminDashboard`에서 `bkendFetch`를 활용해 실제 거래 내역과 통계를 불러오는 로직을 구현합니다.
3. **PDF 파싱 로직 구체화**: 업로드된 파일에서 텍스트를 추출하는 실제 로직을 `pdfParser.ts`에 추가합니다.
4. **AuthGuard 적용**: bkend.ai Auth를 연동하여 로그인 및 권한별 페이지 접근 제어를 설정합니다.
