/*---
id: utils.ts
milestone: M0
why: 기본 구조 파일 (utils.ts)
backlinks: []
---*/

/**
 * @file src/lib/utils.ts
 * @description 공통 유틸리티 함수 모음
 * @purpose yearMonth 등 시스템 전역에서 사용되는 헬퍼 함수 (HIGH-04 수정)
 */

export function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
