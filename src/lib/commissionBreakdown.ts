/*---
id: commissionBreakdown.ts
milestone: M9
why: 100원 분해 추적기의 두뇌 — 한 건의 중개보수가 SSOT 100원 룰에 따라 어디로 얼마씩 흐르는지 계산하는 순수 함수 (정산 엔진과 규칙 공유)
backlinks: [[SSOT_Commission_100won_Rule.md]]
---*/

/**
 * @file src/lib/commissionBreakdown.ts
 * @description 단건/월간 중개보수의 100원 룰 분배 분해 (Pure Functions)
 * @purpose 투명성 뷰(추적기)·오버라이딩 시뮬레이터·AI 보좌관이 공유하는 단일 계산 코어.
 *          settlementService와 동일한 규칙을 사용해야 하며, 테스트로 상호 일치를 강제한다.
 */

import { ROLES, type UserRole } from '@/types';

/**
 * 영업지원비 계단식 산정 (2026-06-11 대표 확언):
 * 1,000만 미만 구간은 100만 단위 절사 10% (구간 돌파 동기부여),
 * 1,000만 이상은 격려 차원의 15%.
 */
export function getBonus(companyRev: number): number {
  if (companyRev < 1_000_000) return 0;
  if (companyRev < 10_000_000) return Math.floor(companyRev / 1_000_000) * 1_000_000 * 0.1;
  return companyRev * 0.15;
}

/** 직급별 기본 지급율 (기본 50% + 사기진작 상향) */
export function getPayoutRate(role: string): number {
  if (role === ROLES.REGULAR) return 0.5;
  if (role === ROLES.TEAM_LEADER) return 0.6;
  return 0.7; // DIV_HEAD, BRANCH_MGR 본인 영업분
}

export type BreakdownShare = {
  key: 'agent' | 'agentBonus' | 'teamLeader' | 'divHead' | 'branchPool' | 'company';
  label: string;
  amount: number;
  /** 중개보수 총액 대비 비율 (%) */
  pct: number;
  formula: string;
};

export type GrossBreakdown = {
  gross: number;
  role: UserRole | string;
  payoutRate: number;
  companyRev: number;
  shares: BreakdownShare[];
};

/**
 * 한 직원이 창출한 중개보수(gross)가 100원 룰에 따라 어디로 흐르는지 분해한다.
 * settlementService.processMonthlySettlement와 동일한 규칙:
 *  - 본인: 기본 지급율 + 영업지원비(계단식)
 *  - 사원의 회사귀속분 → 팀장 20% / 본부장 10% / 지점장 풀 5%
 *  - 팀장의 회사귀속분 → 본부장 10% / 지점장 풀 5% (팀장 오버라이딩 없음)
 *  - 잔여 = 회사
 */
export function breakdownGross(role: string, gross: number): GrossBreakdown {
  const payoutRate = getPayoutRate(role);
  const base = gross * payoutRate;
  const companyRev = gross - base;
  const isManager = role === ROLES.DIV_HEAD || role === ROLES.BRANCH_MGR;
  const bonus = isManager ? 0 : getBonus(companyRev);

  const tlShare = role === ROLES.REGULAR ? companyRev * 0.20 : 0;
  const dhShare = (role === ROLES.REGULAR || role === ROLES.TEAM_LEADER) ? companyRev * 0.10 : 0;
  const bmShare = (role === ROLES.REGULAR || role === ROLES.TEAM_LEADER || role === ROLES.DIV_HEAD) ? companyRev * 0.05 : 0;
  const company = gross - base - bonus - tlShare - dhShare - bmShare;

  const pct = (v: number) => gross > 0 ? Math.round((v / gross) * 1000) / 10 : 0;

  const shares: BreakdownShare[] = [
    { key: 'agent', label: '본인 기본 지급', amount: Math.floor(base), pct: pct(base), formula: `총액 × ${payoutRate * 100}%` },
    { key: 'agentBonus', label: '본인 영업지원비', amount: Math.floor(bonus), pct: pct(bonus), formula: '회사귀속분 계단식 (100만 절사 10% / 1,000만↑ 15%)' },
    { key: 'teamLeader', label: '팀장 오버라이딩', amount: Math.floor(tlShare), pct: pct(tlShare), formula: '회사귀속분 × 20%' },
    { key: 'divHead', label: '본부장 오버라이딩', amount: Math.floor(dhShare), pct: pct(dhShare), formula: '회사귀속분 × 10%' },
    { key: 'branchPool', label: '지점장 풀', amount: Math.floor(bmShare), pct: pct(bmShare), formula: '회사귀속분 × 5% (지점장 균등 분배)' },
    { key: 'company', label: '회사 (본사 귀속)', amount: Math.floor(company), pct: pct(company), formula: '잔여분' },
  ];

  return { gross, role, payoutRate, companyRev, shares };
}
