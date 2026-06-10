# ⚠️ 응급 복구 스크립트 보관소 (재실행 금지)

2026-06-10 문서 대량 손상 사고 당시 사용된 1회성 응급 스크립트들이다.
**절대 재실행하지 말 것** — 특히 `recover.js`는 로그 시스템의 2KB 절단 한계 때문에
잘린 내용으로 원본을 덮어써서 `code_audit_report.md` 원문 90%를 영구 소실시킨 전력이 있다.

사고 경위와 교훈: `erp_workspace/docs/Project_Diagnosis_and_Completion_Strategy_20260611.md` 진단 보고서 참조.

| 스크립트 | 당시 용도 |
|---|---|
| recover.js | transcript.jsonl에서 손상 문서 복구 시도 (→ 2차 손상 유발) |
| fix_escapes.js / fix_frontmatter.js / clean_frontmatter.js | 프론트메터 일괄 주입/수습 |
| patch_page.js | page.tsx 응급 패치 |
| createMockups.js | 목업 페이지 일괄 생성 (SEQ_001) |

> 일괄 수정 스크립트 운영 수칙: 반드시 git 커밋 직후에만, dry-run 검증 후 실행한다.
