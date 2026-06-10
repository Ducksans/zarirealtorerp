# System Overview Map

이 문서는 ERP 시스템 내 모든 주요 파일의 **단일 책임(Single Responsibility)**을 명시하고 전체를 조망하는 역할을 합니다.
파일이 추가되거나 역할이 변경될 경우 반드시 이 문서도 함께 업데이트해야 합니다.

## 1. 기반 설정 및 아키텍처 문서
| 파일명 | 책임 및 목적 |
|---|---|
| `/SYSTEM_ARCHITECTURE.md` | 기술 스택, 비즈니스 룰(정산 비율 등) 및 아키텍처 대원칙을 규정하는 SSOT 문서 |
| `/system_overview.md` | 현재 보고 있는 문서로, 파일별 1파일 1책임 구조를 맵핑한 시스템 전체 조망 맵 |
| `/prisma/schema.prisma` | 데이터베이스 테이블 구조(User, Contract, Settlement, Notice) 정의 및 ORM 매핑 |

## 2. 공통 유틸리티, 서비스 및 타입 (src/lib, src/services, src/types)
| 파일명 | 책임 및 목적 |
|---|---|
| `src/types/index.ts` | 시스템 전역 공유 타입 및 상수 (UserRole, SettlementRow 등) 정의 |
| `src/lib/prisma.ts` | PrismaClient 글로벌 싱글턴 인스턴스 관리 (HMR 누수 방지) |
| `src/lib/errorHandler.ts` | API 에러를 중앙 집중적으로 처리하고 규격화된 메시지를 반환하는 미들웨어 역할 |
| `src/lib/utils.ts` | yearMonth 등 시스템 전역에서 사용되는 공통 헬퍼 함수 모음 |
| `src/lib/settlementService.ts` | 정산 비율 적용, 오버라이딩 계산, 최종 정산 레코드 생성 비즈니스 로직 및 트랜잭션 전담 |
| `src/services/userService.ts` | 사용자 생성(사번 순차발급), 삭제, 조회 등 User 관련 비즈니스 로직 전담 |
| `src/services/contractService.ts` | 계약(매출) 데이터 생성(100원 절사) 및 조회 비즈니스 로직 전담 |
| `src/services/noticeService.ts` | 공지사항 게시판 데이터베이스 통신 및 비즈니스 로직 전담 |
| `src/services/dashboardService.ts` | 대시보드 통계 및 정산 내역 조회용 비즈니스 로직 전담 |
| `src/services/approvalService.ts` | 전자결재(M6) 파이프라인 관리 및 결재 승인/반려 비즈니스 로직 전담 |

## 3. 백엔드 컨트롤러 (src/app/api)
| 파일명 | 책임 및 목적 |
|---|---|
| `src/app/api/users/route.ts` | 사용자 관리 REST API 엔드포인트 (파라미터 파싱 및 응답 포맷팅) |
| `src/app/api/contracts/route.ts` | 계약 관리 REST API 엔드포인트 (파라미터 파싱 및 응답 포맷팅) |
| `src/app/api/settlement/route.ts` | 월간 정산 실행 트리거 API 엔드포인트 |
| `src/app/api/dashboard/route.ts` | 대시보드 통계 및 정산 내역 조회용 API 엔드포인트 |
| `src/app/api/seed/route.ts` | 개발 및 테스트용 대규모 더미 데이터 생성 전담 라우트 |
| `src/app/api/notices/route.ts` | 공지사항 관리 REST API 엔드포인트 |
| `src/app/api/approvals/route.ts` | 전자결재(M6) 대기 목록 조회 API 엔드포인트 |
| `src/app/api/approvals/[id]/route.ts` | 전자결재(M6) 승인 및 반려 처리 API 엔드포인트 |

## 4. 프론트엔드 라우트 (src/app)
| 파일명 | 책임 및 목적 |
|---|---|
| `src/app/layout.tsx` | 전역 레이아웃 및 폰트/스타일 래퍼 |
| `src/app/page.tsx` | 메인 대시보드 화면 진입점 (차후 하위 컴포넌트로 분할 예정) |
| `src/app/hr/page.tsx` | 인사 관리 화면 진입점 (사번 검색 및 조직도 관리) |
| `src/app/contracts/page.tsx` | 계약 관리 화면 진입점 (매출 실적 입력 및 조회) |
| `src/app/notice/page.tsx` | 공지사항 게시판 화면 진입점 |
| `src/app/hr/approvals/page.tsx` | 전자결재(M6) 화면 진입점 (결재선 진행 및 AI 멘토링 리포트 확인) |

## 5. UI 컴포넌트 (src/components)
| 파일명 | 책임 및 목적 |
|---|---|
| `src/components/Navbar.tsx` | 상단 전역 네비게이션 메뉴 바 전담 컴포넌트 |
| `src/components/dashboard/DashboardHeader.tsx` | 대시보드 최상단 타이틀과 초기화/정산 버튼 컴포넌트 |
| `src/components/dashboard/SummaryCards.tsx` | 법인 총매출, 순수익, 마진율 등 핵심 재무 지표 시각화 컴포넌트 |
| `src/components/dashboard/SettlementTable.tsx` | 검색 필터를 포함한 직원별 정산 내역 테이블 컴포넌트 |
| `src/components/hr/UserForm.tsx` | 인사 관리 - 신규 사원 등록 및 상사 할당 폼 컴포넌트 |
| `src/components/hr/UserTable.tsx` | 검색 필터를 포함한 조직도 및 사원 목록 테이블 컴포넌트 |
| `src/components/contracts/ContractForm.tsx` | 계약 관리 - 담당 사원 검색 및 신규 매출 등록 폼 컴포넌트 |
| `src/components/contracts/ContractTable.tsx` | 전사 매출 내역 시각화 및 삭제 기능을 제공하는 테이블 컴포넌트 |
