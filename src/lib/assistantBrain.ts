/*---
id: assistantBrain.ts
milestone: M10
why: AI 보좌관의 결정론적 분석 코어 — LLM 없이 DB 실데이터(계약·정산·계보)를 100원 룰 엔진으로 분해해 "내 정산 왜 줄었어?"에 숫자 근거가 달린 한국어 내러티브로 답한다 (거짓말을 못 하는 보좌관)
backlinks: [[SSOT_Commission_100won_Rule.md]], [[commissionBreakdown.ts]], [[assistant_api]]
---*/

/**
 * @file src/lib/assistantBrain.ts
 * @description AI 보좌관 결정론적 분석 엔진 (서버 전용 — prisma 직접 사용)
 * @purpose intent 분류(정규식) → 실데이터 조회 → commissionBreakdown 규칙으로 분해 →
 *          한국어 내러티브 생성. 모든 숫자는 정산 엔진과 동일한 규칙에서 나온다.
 */

import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errorHandler';
import { breakdownGross, getBonus, getPayoutRate, type GrossBreakdown } from '@/lib/commissionBreakdown';
import { getCurrentYearMonth } from '@/lib/utils';
import { ROLES, ROLES_KO, type UserRole } from '@/types';

export type AssistantAnswer = {
  reply: string;
  suggestions?: string[];
};

/** 첫 진입/fallback에서 노출하는 대표 질문 칩 */
export const DEFAULT_SUGGESTIONS = [
  '이번 달 얼마 받아?',
  '지난달보다 왜 달라졌어?',
  '팀원 1명 더 늘면?',
  '영업지원비 다음 구간까지 얼마 남았어?',
] as const;

/** 시뮬레이션 가정: 가상 팀원 1명의 월 매출 */
const SIM_MEMBER_GROSS = 6_000_000;
/** 팀장 진급 조건: 누적 회사 입금분 */
const PROMOTION_THRESHOLD = 36_000_000;

// ===== 공통 유틸 =====

const fmt = (n: number) => `₩${Math.floor(n).toLocaleString('ko-KR')}`;

/** 10,000원 단위로 떨어지면 "600만 원" 식으로, 아니면 ₩ 표기 */
function man(n: number): string {
  const v = Math.floor(n);
  if (v !== 0 && v % 10_000 === 0) return `${(v / 10_000).toLocaleString('ko-KR')}만 원`;
  return fmt(v);
}

function signed(n: number): string {
  return `${n >= 0 ? '+' : '-'}${fmt(Math.abs(n))}`;
}

/** "2026-06" → "6월" */
function monthLabel(ym: string): string {
  return `${parseInt(ym.slice(5, 7), 10)}월`;
}

function prevYearMonth(ym: string): string {
  const d = new Date(`${ym}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** yearMonth(YYYY-MM)의 UTC 월 경계 [시작, 다음달 1일) */
function monthRange(ym: string): { gte: Date; lt: Date } {
  const start = new Date(`${ym}-01T00:00:00Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { gte: start, lt: end };
}

/** 영업지원비 계단 구간 라벨 (회사귀속분 기준) */
function bonusTierLabel(companyRev: number): string {
  if (companyRev < 1_000_000) return '100만 미만 구간(지원비 없음)';
  if (companyRev < 10_000_000) return `${Math.floor(companyRev / 1_000_000) * 100}만 구간(10%)`;
  return '1,000만 이상 구간(15%)';
}

function shareAmount(bd: GrossBreakdown, key: 'agent' | 'agentBonus'): number {
  return bd.shares.find(s => s.key === key)?.amount ?? 0;
}

// ===== 데이터 수집 =====

type SlimUser = { id: string; name: string; role: string };

async function sumGross(agentIds: string[], range: { gte: Date; lt: Date }): Promise<number> {
  if (agentIds.length === 0) return 0;
  const agg = await prisma.contract.aggregate({
    where: { agentId: { in: agentIds }, contractDate: range },
    _sum: { grossCommission: true },
  });
  return agg._sum.grossCommission ?? 0;
}

/**
 * 직급별 오버라이딩 예상 수입 (home API와 동일 규칙):
 *  - 팀장: 직속 사원 매출 × 50%(회사귀속분) × 20%
 *  - 본부장: 산하 팀장(×40%) + 그 팀장들의 사원(×50%) 회사귀속분 × 10%
 *  - 지점장: 풀(전사 5%) 분배는 전사 계산이라 0 처리
 */
async function getOverrideIncome(user: SlimUser, range: { gte: Date; lt: Date }): Promise<number> {
  if (user.role === ROLES.TEAM_LEADER) {
    const regulars = await prisma.user.findMany({
      where: { uplineId: user.id, role: ROLES.REGULAR, status: 'ACTIVE' },
      select: { id: true },
    });
    const teamGross = await sumGross(regulars.map(r => r.id), range);
    return Math.floor(teamGross * 0.5 * 0.2);
  }
  if (user.role === ROLES.DIV_HEAD) {
    const tls = await prisma.user.findMany({
      where: { uplineId: user.id, role: ROLES.TEAM_LEADER, status: 'ACTIVE' },
      select: { id: true },
    });
    const tlIds = tls.map(t => t.id);
    const tlGross = await sumGross(tlIds, range);
    const regulars = tlIds.length > 0
      ? await prisma.user.findMany({
          where: { uplineId: { in: tlIds }, role: ROLES.REGULAR, status: 'ACTIVE' },
          select: { id: true },
        })
      : [];
    const regGross = await sumGross(regulars.map(r => r.id), range);
    return Math.floor((tlGross * 0.4 + regGross * 0.5) * 0.1);
  }
  return 0;
}

type MonthlyFinance = {
  yearMonth: string;
  gross: number;
  contractCount: number;
  companyRev: number; // 계약 기반 회사귀속분 (구간 분석용)
  basePay: number;
  bonusPay: number;
  overridePay: number;
  totalPay: number;
  settled: boolean; // 확정 정산서 존재 여부
  signatureStatus: string | null;
  paymentStatus: string | null;
};

/** 한 달치 재무 스냅샷: Settlement가 있으면 확정치, 없으면 계약 기반 breakdownGross 예상치 */
async function getMonthlyFinance(user: SlimUser, ym: string): Promise<MonthlyFinance> {
  const range = monthRange(ym);
  const [agg, settlement, overrideEst] = await Promise.all([
    prisma.contract.aggregate({
      where: { agentId: user.id, contractDate: range },
      _sum: { grossCommission: true },
      _count: true,
    }),
    prisma.settlement.findFirst({
      where: { userId: user.id, yearMonth: ym },
      select: {
        basePay: true, bonusPay: true, overridePay: true, totalPay: true,
        signatureStatus: true, paymentStatus: true,
      },
    }),
    getOverrideIncome(user, range),
  ]);

  const gross = agg._sum.grossCommission ?? 0;
  const bd = breakdownGross(user.role, gross);

  if (settlement) {
    return {
      yearMonth: ym,
      gross,
      contractCount: agg._count,
      companyRev: bd.companyRev,
      basePay: settlement.basePay,
      bonusPay: settlement.bonusPay,
      overridePay: settlement.overridePay,
      totalPay: settlement.totalPay,
      settled: true,
      signatureStatus: settlement.signatureStatus,
      paymentStatus: settlement.paymentStatus,
    };
  }

  const basePay = shareAmount(bd, 'agent');
  const bonusPay = shareAmount(bd, 'agentBonus');
  return {
    yearMonth: ym,
    gross,
    contractCount: agg._count,
    companyRev: bd.companyRev,
    basePay,
    bonusPay,
    overridePay: overrideEst,
    totalPay: basePay + bonusPay + overrideEst,
    settled: false,
    signatureStatus: null,
    paymentStatus: null,
  };
}

// ===== intent 분류 =====

type Intent = 'diff' | 'status' | 'rules' | 'simulation' | 'bonusTier' | 'fallback';

function classifyIntent(message: string): Intent {
  const m = message.replace(/\s+/g, '');
  // 1. 전월 비교/증감 원인
  if (/줄었|줄어|늘었|달라졌|달라진|차이|비교|전월|지난달|저번달|왜(줄|늘|감소|증가|적|많)/.test(m)) return 'diff';
  // 2. 영업지원비 구간 (status보다 먼저 — "얼마 남았어"에 '얼마' 포함)
  if (/지원비|보너스|구간|점프/.test(m)) return 'bonusTier';
  // 3. 시뮬레이션 (팀원/진급)
  if (/팀원|진급|승격|시뮬|충원|리크루|명더|늘면|늘리면|영입/.test(m)) return 'simulation';
  // 4. 규칙 설명
  if (/100원|룰|수수료|분배|오버라이딩|왜떼|떼가|떼이|어떻게나눠|규칙/.test(m)) return 'rules';
  // 5. 이번 달 현황
  if (/얼마받|얼마야|얼마나와|얼마예요|얼마에요|내정산|이번달|수령액|월급|급여|받아|받죠|받나/.test(m)) return 'status';
  return 'fallback';
}

// ===== intent별 답변 생성 =====

function answerDiff(user: SlimUser, cur: MonthlyFinance, prev: MonthlyFinance): AssistantAnswer {
  const curM = monthLabel(cur.yearMonth);
  const prevM = monthLabel(prev.yearMonth);

  const noData = cur.gross === 0 && prev.gross === 0 && cur.overridePay === 0 && prev.overridePay === 0 && !cur.settled && !prev.settled;
  if (noData) {
    return {
      reply: `${prevM}과 ${curM} 모두 계약·정산 데이터가 없어 비교할 변동이 없습니다.\n계약이 등록되면 바로 분석해 드릴게요.`,
      suggestions: ['100원 룰이 뭐야?', '영업지원비 구간 설명해줘'],
    };
  }

  const dTotal = cur.totalPay - prev.totalPay;
  const dBase = cur.basePay - prev.basePay;
  const dBonus = cur.bonusPay - prev.bonusPay;
  const dOver = cur.overridePay - prev.overridePay;

  const head = dTotal === 0
    ? `${curM} ${cur.settled ? '확정' : '예상'} 수령액은 ${fmt(cur.totalPay)}로 ${prevM}(${fmt(prev.totalPay)})과 동일합니다.`
    : `${curM} ${cur.settled ? '확정' : '예상'} 수령액은 ${fmt(cur.totalPay)}로 ${prevM}보다 ${fmt(Math.abs(dTotal))} ${dTotal < 0 ? '줄었습니다' : '늘었습니다'}.`;

  const lines = [
    `① 기본 영업수당 ${signed(dBase)} (매출 ${man(prev.gross)}→${man(cur.gross)}, 계약 ${prev.contractCount}건→${cur.contractCount}건)`,
    `② 영업지원비 ${signed(dBonus)} (계단 구간: ${bonusTierLabel(prev.companyRev)}→${bonusTierLabel(cur.companyRev)})`,
    `③ 오버라이딩 ${signed(dOver)} (${man(prev.overridePay)}→${man(cur.overridePay)})`,
  ];

  const factors = [
    { label: '① 기본 영업수당', delta: dBase },
    { label: '② 영업지원비', delta: dBonus },
    { label: '③ 오버라이딩', delta: dOver },
  ].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const biggest = Math.abs(factors[0].delta) > 0
    ? `가장 큰 요인은 ${factors[0].label}입니다.`
    : '세 구성요소 모두 변동이 없습니다.';

  const note = cur.settled
    ? `※ ${curM}분은 확정 정산서 기준입니다.`
    : `※ ${curM} 정산서가 아직 확정되지 않아 계약 데이터 기반 예상치입니다.`;

  return {
    reply: `${head}\n\n원인 분해:\n${lines.join('\n')}\n\n${biggest}\n${note}`,
    suggestions: ['영업지원비 다음 구간까지 얼마 남았어?', '이번 달 얼마 받아?'],
  };
}

function answerStatus(user: SlimUser, cur: MonthlyFinance): AssistantAnswer {
  const m = monthLabel(cur.yearMonth);

  if (cur.gross === 0 && cur.overridePay === 0 && !cur.settled) {
    return {
      reply: `${m}에는 아직 등록된 계약이 없어 예상 수령액이 ₩0입니다.\n계약이 등록되면 100원 룰로 즉시 분해해 보여 드릴게요.`,
      suggestions: ['100원 룰이 뭐야?', '팀원 1명 더 늘면?'],
    };
  }

  const statusLine = cur.settled
    ? `정산서: ${cur.signatureStatus === 'SIGNED' ? '서명 완료' : '서명 대기'} · ${cur.paymentStatus === 'PAID' ? '지급 완료' : cur.paymentStatus === 'NON_PAID' ? '미지급' : '지급 대기'}`
    : '정산서: 미확정 (계약 기반 예상치)';

  const reply = [
    `${m} ${cur.settled ? '확정' : '예상'} 수령액: ${fmt(cur.totalPay)}`,
    '',
    `· 기본 영업수당 ${fmt(cur.basePay)} (계약 ${cur.contractCount}건 · 매출 ${man(cur.gross)})`,
    `· 영업지원비 ${fmt(cur.bonusPay)} (${bonusTierLabel(cur.companyRev)})`,
    `· 오버라이딩 ${fmt(cur.overridePay)}`,
    '',
    statusLine,
  ].join('\n');

  return {
    reply,
    suggestions: ['지난달보다 왜 달라졌어?', '영업지원비 다음 구간까지 얼마 남았어?'],
  };
}

function answerRules(user: SlimUser, cur: MonthlyFinance): AssistantAnswer {
  const roleKo = ROLES_KO[user.role as UserRole] ?? user.role;
  const exampleGross = cur.gross > 0 ? cur.gross : SIM_MEMBER_GROSS;
  const bd = breakdownGross(user.role, exampleGross);
  const base = shareAmount(bd, 'agent');
  const bonus = shareAmount(bd, 'agentBonus');
  const rate = Math.round(getPayoutRate(user.role) * 100);

  const reply = [
    '100원 룰 — 중개보수 100원이 들어오면:',
    '· 직원 본인 55원 (기본 50원 + 영업지원비 약 5원)',
    '· 팀장 오버라이딩 10원 (회사귀속분 50원의 20%)',
    '· 본부장 5원 (10%) · 지점장 풀 2.5원 (5%) · 회사 27.5원',
    '',
    '핵심 원칙: 오버라이딩은 회사 귀속분에서 지급됩니다.',
    '팀장·본부장 몫은 본인 몫에서 떼는 게 아니라 회사 몫에서 나가므로, 팀이 커져도 본인 수령액은 1원도 줄지 않습니다.',
    '',
    '영업지원비 계단식: 회사귀속분 100만 미만 0원 / 100만~1,000만 미만은 100만 단위 절사 후 10% / 1,000만 이상은 전액 15%',
    '',
    `${user.name}님(${roleKo}) 기준 예시 — 매출 ${man(exampleGross)}일 때:`,
    `· 본인 기본 지급(${rate}%): ${fmt(base)}`,
    `· 영업지원비: ${fmt(bonus)} (회사귀속분 ${man(bd.companyRev)} 기준)`,
    `→ 영업분 합계 ${fmt(base + bonus)}`,
  ].join('\n');

  return {
    reply,
    suggestions: ['영업지원비 다음 구간까지 얼마 남았어?', '팀원 1명 더 늘면?'],
  };
}

async function answerSimulation(user: SlimUser, cur: MonthlyFinance): Promise<AssistantAnswer> {
  const perRegularComp = SIM_MEMBER_GROSS * (1 - getPayoutRate(ROLES.REGULAR)); // 300만

  if (user.role === ROLES.REGULAR) {
    const agg = await prisma.contract.aggregate({
      where: { agentId: user.id },
      _sum: { grossCommission: true },
    });
    const cumGross = agg._sum.grossCommission ?? 0;
    const cumComp = Math.floor(cumGross * 0.5); // 사원 회사귀속분 50%
    const remain = Math.max(0, PROMOTION_THRESHOLD - cumComp);
    const pct = Math.min(100, Math.round((cumComp / PROMOTION_THRESHOLD) * 1000) / 10);
    const perMember = Math.floor(perRegularComp * 0.2); // 60만

    const reply = [
      '팀장 진급 시뮬레이션 (사원 기준)',
      `· 진급 조건: 누적 회사 입금분 ${man(PROMOTION_THRESHOLD)}`,
      `· 현재 누적 회사 입금분: ${fmt(cumComp)} (누적 매출 ${man(cumGross)} × 50%) — 달성률 ${pct}%`,
      remain > 0
        ? `· 남은 금액: ${fmt(remain)} (매출 기준 약 ${man(remain * 2)} 추가 필요)`
        : '· 조건 달성! 팀장 승격 대상입니다.',
      '',
      `진급 후에는 직속 팀원 회사귀속분의 20%가 오버라이딩으로 들어옵니다.`,
      `팀원 1명(월 매출 ${man(SIM_MEMBER_GROSS)} 가정)당 +${fmt(perMember)}/월입니다.`,
    ].join('\n');

    return { reply, suggestions: ['100원 룰이 뭐야?', '이번 달 얼마 받아?'] };
  }

  if (user.role === ROLES.TEAM_LEADER) {
    const count = await prisma.user.count({
      where: { uplineId: user.id, role: ROLES.REGULAR, status: 'ACTIVE' },
    });
    const perMember = Math.floor(perRegularComp * 0.2); // 60만
    const reply = [
      `현재 직속 팀원(사원) ${count}명 · 이번 달 오버라이딩 ${fmt(cur.overridePay)}`,
      '',
      `팀원 1명(월 매출 ${man(SIM_MEMBER_GROSS)} 가정)을 더 영입하면:`,
      `회사귀속분 ${man(perRegularComp)} × 20% = +${fmt(perMember)}/월`,
      `3명 영입 시 +${fmt(perMember * 3)}/월입니다.`,
      '',
      '오버라이딩은 회사 귀속분에서 지급되므로 팀원 몫은 줄지 않습니다.',
    ].join('\n');
    return { reply, suggestions: ['지난달보다 왜 달라졌어?', '이번 달 얼마 받아?'] };
  }

  if (user.role === ROLES.DIV_HEAD) {
    const tlCount = await prisma.user.count({
      where: { uplineId: user.id, role: ROLES.TEAM_LEADER, status: 'ACTIVE' },
    });
    const perMember = Math.floor(perRegularComp * 0.1); // 30만
    const reply = [
      `현재 직속 팀장 ${tlCount}명 · 이번 달 오버라이딩 ${fmt(cur.overridePay)}`,
      '',
      `산하에 사원 1명(월 매출 ${man(SIM_MEMBER_GROSS)} 가정)이 늘면:`,
      `회사귀속분 ${man(perRegularComp)} × 10% = +${fmt(perMember)}/월입니다.`,
      '조직이 커질수록 본부장 오버라이딩(10%)이 비례해 늘어납니다.',
    ].join('\n');
    return { reply, suggestions: ['이번 달 얼마 받아?', '지난달보다 왜 달라졌어?'] };
  }

  // BRANCH_MGR
  return {
    reply: [
      '지점장 풀(전사 회사귀속분의 5%)은 전사 매출 기준으로 지점장들에게 균등 분배됩니다.',
      '개별 팀원 추가 시뮬레이션 대상이 아니며, 전사 매출이 늘수록 풀 자체가 커집니다.',
    ].join('\n'),
    suggestions: ['이번 달 얼마 받아?', '100원 룰이 뭐야?'],
  };
}

function answerBonusTier(user: SlimUser, cur: MonthlyFinance): AssistantAnswer {
  const m = monthLabel(cur.yearMonth);

  if (user.role === ROLES.DIV_HEAD || user.role === ROLES.BRANCH_MGR) {
    return {
      reply: [
        `${ROLES_KO[user.role as UserRole]}은 영업지원비 지급 대상이 아닙니다.`,
        '대신 본인 영업분 기본 지급율이 70%로 상향 적용되고, 오버라이딩/풀 수입이 별도로 있습니다.',
      ].join('\n'),
      suggestions: ['이번 달 얼마 받아?', '팀원 1명 더 늘면?'],
    };
  }

  const compRate = 1 - getPayoutRate(user.role); // 사원 0.5, 팀장 0.4
  const compRev = cur.companyRev;
  const curBonus = getBonus(compRev);

  if (compRev >= 10_000_000) {
    return {
      reply: [
        `${m} 매출 ${man(cur.gross)} → 회사귀속분 ${fmt(compRev)}`,
        `현재 최고 구간(1,000만 이상 15%) 적용 중 — 영업지원비 ${fmt(curBonus)}`,
        '이 구간부터는 매출이 늘어난 만큼 지원비도 15% 비례로 함께 늘어납니다.',
      ].join('\n'),
      suggestions: ['이번 달 얼마 받아?', '지난달보다 왜 달라졌어?'],
    };
  }

  const nextComp = compRev < 1_000_000
    ? 1_000_000
    : (Math.floor(compRev / 1_000_000) + 1) * 1_000_000;
  const nextBonus = getBonus(nextComp);
  const neededGross = Math.ceil((nextComp - compRev) / compRate);

  const reply = [
    `${m} 매출 ${man(cur.gross)} → 회사귀속분 ${fmt(compRev)} (매출의 ${Math.round(compRate * 100)}%)`,
    `현재 구간: ${bonusTierLabel(compRev)} → 영업지원비 ${fmt(curBonus)}`,
    '',
    `다음 구간: 회사귀속분 ${man(nextComp)} 달성 시 지원비 ${fmt(nextBonus)}`,
    `→ 매출 ${fmt(neededGross)} 더 하면 지원비가 ${fmt(curBonus)} → ${fmt(nextBonus)}로 점프합니다.`,
  ].join('\n');

  return { reply, suggestions: ['이번 달 얼마 받아?', '팀원 1명 더 늘면?'] };
}

// ===== 메인 엔트리 =====

/**
 * 사용자 질문을 결정론적으로 분석해 답변한다.
 * @param userId  대상 직원 id
 * @param message 자연어 질문
 * @param yearMonth 기준 월(YYYY-MM, 생략 시 이번 달)
 */
export async function answerQuestion(
  userId: string,
  message: string,
  yearMonth?: string,
): Promise<AssistantAnswer> {
  const ym = yearMonth ?? getCurrentYearMonth();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(ym)) {
    throw new AppError('yearMonth 형식은 YYYY-MM 입니다.', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  });
  if (!user) throw new AppError('직원을 찾을 수 없습니다.', 404);

  const intent = classifyIntent(message);

  if (intent === 'fallback') {
    return {
      reply: [
        '질문을 정확히 이해하지 못했어요.',
        '저는 정산 데이터를 직접 분석해 답하는 보좌관입니다. 아래처럼 물어보세요.',
      ].join('\n'),
      suggestions: [...DEFAULT_SUGGESTIONS],
    };
  }

  const cur = await getMonthlyFinance(user, ym);

  switch (intent) {
    case 'diff': {
      const prev = await getMonthlyFinance(user, prevYearMonth(ym));
      return answerDiff(user, cur, prev);
    }
    case 'status':
      return answerStatus(user, cur);
    case 'rules':
      return answerRules(user, cur);
    case 'simulation':
      return answerSimulation(user, cur);
    case 'bonusTier':
      return answerBonusTier(user, cur);
  }
}
