/**
 * @file tests/settlement.scenarios.test.ts
 * @description 100원 룰 + 수익 시뮬레이션 8대 시나리오 영구 박제 테스트
 *
 * 근거 문서 (SSOT):
 *  - docs/SSOT_Commission_100won_Rule.md — 2026-06-09 03:23 대표 확정:
 *    "중개보수 총액 100원 = 직원 55 > 팀장 10 > 본부장 5 > 지점장 2.5 > 회사 27.5"
 *    오버라이딩 제1원칙: "상위 직급의 리드 서포트는 팀원의 파이를 갉아먹지 않는다"
 *  - docs/revenue_simulation.md — 대표 승인 완결판 시나리오 1~8 (기대 수치 명기)
 *
 * 이 테스트가 깨지면 정산 엔진이 대표님의 확정 결정에서 이탈(드리프트)한 것이다.
 * 절대 기대값을 수정해서 통과시키지 말 것 — 결정 변경은 SSOT 개정 승인 후에만 가능하다.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { processMonthlySettlement } from '@/lib/settlementService';
import { ROLES } from '@/types';

const YM = '2026-06';
const 만 = 10_000; // 가독성: 시뮬레이션 문서가 만원 단위이므로

type OrgSpec = {
  regulars: { count: number; revenue: number };
  teamLeaders: { count: number; revenue: number };
  divHeads?: { count: number };
  branchMgrs?: { count: number };
};

/**
 * 조직을 시딩한다.
 * - 팀장은 본부장에 라운드로빈 배속, 사원은 "본부장 그룹 간 균등"이 되도록
 *   본부장별로 인터리브된 팀장 순서에 라운드로빈 배속한다.
 *   (시뮬레이션 문서의 '평균 수령액'은 균등 분포를 전제하기 때문)
 */
async function seedOrg(spec: OrgSpec) {
  await prisma.settlement.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  const dhCount = spec.divHeads?.count ?? 0;
  const bmCount = spec.branchMgrs?.count ?? 0;

  const branchMgrs = [];
  for (let i = 0; i < bmCount; i++) {
    branchMgrs.push(await prisma.user.create({
      data: { name: `지점장${i + 1}`, role: ROLES.BRANCH_MGR },
    }));
  }

  const divHeads = [];
  for (let i = 0; i < dhCount; i++) {
    divHeads.push(await prisma.user.create({
      data: { name: `본부장${i + 1}`, role: ROLES.DIV_HEAD, uplineId: branchMgrs[i % bmCount]?.id ?? null },
    }));
  }

  // 팀장: 본부장에 라운드로빈 배속
  const teamLeaders = [];
  for (let i = 0; i < spec.teamLeaders.count; i++) {
    teamLeaders.push(await prisma.user.create({
      data: { name: `팀장${i + 1}`, role: ROLES.TEAM_LEADER, uplineId: divHeads[i % dhCount]?.id ?? null },
    }));
  }

  // 본부장 그룹 간 균등 분포를 위해 팀장 목록을 본부장 기준으로 인터리브
  const interleaved: typeof teamLeaders = [];
  if (dhCount > 1) {
    const groups: (typeof teamLeaders)[] = Array.from({ length: dhCount }, () => []);
    teamLeaders.forEach((tl, i) => groups[i % dhCount].push(tl));
    const maxLen = Math.max(...groups.map(g => g.length));
    for (let j = 0; j < maxLen; j++) {
      for (const g of groups) if (g[j]) interleaved.push(g[j]);
    }
  } else {
    interleaved.push(...teamLeaders);
  }

  const regulars = [];
  for (let i = 0; i < spec.regulars.count; i++) {
    regulars.push(await prisma.user.create({
      data: { name: `사원${i + 1}`, role: ROLES.REGULAR, uplineId: interleaved[i % interleaved.length]?.id ?? null },
    }));
  }

  // 계약(매출) 생성
  const contracts = [
    ...regulars.map(u => ({ agentId: u.id, grossCommission: spec.regulars.revenue })),
    ...teamLeaders.map(u => ({ agentId: u.id, grossCommission: spec.teamLeaders.revenue })),
  ];
  await prisma.contract.createMany({ data: contracts });

  return { regulars, teamLeaders, divHeads, branchMgrs };
}

/** 정산 실행 후 직급별 집계와 본사 순이익을 계산한다. */
async function settle() {
  await processMonthlySettlement(YM);
  const rows = await prisma.settlement.findMany({ where: { yearMonth: YM }, include: { user: true } });
  const gross = (await prisma.contract.aggregate({ _sum: { grossCommission: true } }))._sum.grossCommission ?? 0;
  const totalPaid = rows.reduce((s, r) => s + r.totalPay, 0);

  const byRole = (role: string) => rows.filter(r => r.user.role === role);
  const sum = (rs: typeof rows, f: (r: (typeof rows)[number]) => number) => rs.reduce((s, r) => s + f(r), 0);

  return { rows, gross, companyProfit: gross - totalPaid, byRole, sum };
}

describe('100원 룰 — 단건 분배의 정의 (SSOT_Commission_100won_Rule.md)', () => {
  beforeEach(async () => {
    // 각 테스트가 자체 시딩
  });

  it('신입 사원: 월 매출 600만 → 실수령 330만 (총액의 55%) — 대표 검산 L97/L104', async () => {
    await seedOrg({ regulars: { count: 1, revenue: 600 * 만 }, teamLeaders: { count: 0, revenue: 0 } });
    const r = await settle();
    const reg = r.byRole(ROLES.REGULAR)[0];
    expect(reg.basePay).toBe(300 * 만);   // 기본 지급율 50%
    expect(reg.bonusPay).toBe(30 * 만);   // 영업지원비 (회사입금 300만의 10%)
    expect(reg.totalPay).toBe(330 * 만);  // = 100원 중 55원
  });

  it('단건 100원 분해: 사원600만 1명 체인 → 팀장 10원, 본부장 5원, 지점장 2.5원, 회사 27.5원', async () => {
    const org = await seedOrg({
      regulars: { count: 1, revenue: 600 * 만 },
      teamLeaders: { count: 1, revenue: 0 },
      divHeads: { count: 1 },
      branchMgrs: { count: 1 },
    });
    const r = await settle();
    const tl = r.byRole(ROLES.TEAM_LEADER)[0];
    const dh = r.byRole(ROLES.DIV_HEAD)[0];
    const bm = r.byRole(ROLES.BRANCH_MGR)[0];

    expect(r.byRole(ROLES.REGULAR)[0].totalPay).toBe(330 * 만); // 직원 55원
    expect(tl.overridePay).toBe(60 * 만);                        // 팀장 10원 (회사귀속분 300만의 20%)
    expect(dh.overridePay).toBe(30 * 만);                        // 본부장 5원 (산하 귀속분의 10%)
    expect(bm.overridePay).toBe(15 * 만);                        // 지점장 2.5원 (귀속분 5% 풀)
    expect(r.companyProfit).toBe(165 * 만);                      // 회사 27.5원

    // 오버라이딩 제1원칙: 직원 몫(55%)은 어떤 관리자 체인에서도 불변
    expect(330 * 만 + 60 * 만 + 30 * 만 + 15 * 만 + 165 * 만).toBe(600 * 만);
  });
});

describe('월 정산 범위 — 해당 월 계약만 포함 (중복 정산 차단, 2026-06-11 실데이터 검증 결함 수정)', () => {
  it('지난달 계약은 이번 달 정산에 포함되지 않는다', async () => {
    const org = await seedOrg({ regulars: { count: 1, revenue: 600 * 만 }, teamLeaders: { count: 0, revenue: 0 } });
    // 같은 직원의 "지난달" 계약 추가 — 이번 달 정산에 섞이면 안 된다
    const lastMonth = new Date();
    lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 1);
    await prisma.contract.create({
      data: { agentId: org.regulars[0].id, grossCommission: 1000 * 만, contractDate: lastMonth },
    });

    const r = await settle();
    // 이번 달 600만 계약만 정산: 300만 + 30만 = 330만 (지난달 1,000만은 제외)
    expect(r.byRole(ROLES.REGULAR)[0].totalPay).toBe(330 * 만);
  });
});

describe('영업지원비 계단식 — 구간 돌파 동기부여 설계 (2026-06-11 대표 확언)', () => {
  // "계단식으로 책정해야 구간을 넘어서려는 노력을 한다. 1,000만 초과는 흔치 않으니 격려 차원에서 15%"
  it('회사귀속분 100만 미만 → 지원비 0원', async () => {
    await seedOrg({ regulars: { count: 1, revenue: 180 * 만 }, teamLeaders: { count: 0, revenue: 0 } });
    const r = await settle();
    expect(r.byRole(ROLES.REGULAR)[0].bonusPay).toBe(0); // 귀속분 90만 → 구간 미달
  });

  it('귀속분 990만 → 90만 (100만 단위 절사 10%, 다음 구간을 향한 긴장)', async () => {
    await seedOrg({ regulars: { count: 1, revenue: 1980 * 만 }, teamLeaders: { count: 0, revenue: 0 } });
    const r = await settle();
    expect(r.byRole(ROLES.REGULAR)[0].bonusPay).toBe(90 * 만);
  });

  it('귀속분 1,000만 돌파 → 150만 (15% 통 큰 격려 점프)', async () => {
    await seedOrg({ regulars: { count: 1, revenue: 2000 * 만 }, teamLeaders: { count: 0, revenue: 0 } });
    const r = await settle();
    expect(r.byRole(ROLES.REGULAR)[0].bonusPay).toBe(150 * 만); // 999만의 90만에서 60만 점프
  });
});

describe('수익 시뮬레이션 8대 시나리오 영구 박제 (revenue_simulation.md 완결판)', () => {
  it('S1 가분수 조직: 총매출 9,300만 / 본사 순이익 3,390만 (마진 36.5%)', async () => {
    await seedOrg({ regulars: { count: 13, revenue: 500 * 만 }, teamLeaders: { count: 7, revenue: 400 * 만 } });
    const r = await settle();
    expect(r.gross).toBe(9300 * 만);
    expect(r.companyProfit).toBe(3390 * 만);
    // 평사원 270만 (영업 250 + 지원비 20)
    for (const reg of r.byRole(ROLES.REGULAR)) expect(reg.totalPay).toBe(270 * 만);
    // 팀장 영업분 250만 + 오버라이딩 평균 92만 (총합으로 검증)
    const tls = r.byRole(ROLES.TEAM_LEADER);
    for (const tl of tls) expect(tl.basePay + tl.bonusPay).toBe(250 * 만);
    expect(r.sum(tls, t => t.overridePay)).toBe(650 * 만); // 13명 × 250만 × 20%
  });

  it('S2 평사원 실적 상향(패시브 인컴): 총매출 1억600만 / 본사 3,780만 (마진 35.7%)', async () => {
    await seedOrg({ regulars: { count: 13, revenue: 600 * 만 }, teamLeaders: { count: 7, revenue: 400 * 만 } });
    const r = await settle();
    expect(r.gross).toBe(10600 * 만);
    expect(r.companyProfit).toBe(3780 * 만);
    // 팀장은 본인 영업을 더 하지 않아도 오버라이딩 총액이 650만 → 780만으로 자동 상승
    expect(r.sum(r.byRole(ROLES.TEAM_LEADER), t => t.overridePay)).toBe(780 * 만);
  });

  it('S3 본부장 최초 등장: 총매출 1억200만 / 본사 3,144만 (마진 30.8%) / 본부장 486만', async () => {
    await seedOrg({
      regulars: { count: 13, revenue: 600 * 만 },
      teamLeaders: { count: 6, revenue: 400 * 만 },
      divHeads: { count: 1 },
    });
    const r = await settle();
    expect(r.gross).toBe(10200 * 만);
    expect(r.companyProfit).toBe(3144 * 만);
    expect(r.byRole(ROLES.DIV_HEAD)[0].totalPay).toBe(486 * 만); // 100% 오버라이딩 (불로소득)
  });

  it('S4 조직 2배 팽창: 총매출 2억400만 / 본사 6,288만 (마진 30.8% 유지 — 선형 확장성)', async () => {
    await seedOrg({
      regulars: { count: 26, revenue: 600 * 만 },
      teamLeaders: { count: 12, revenue: 400 * 만 },
      divHeads: { count: 1 },
    });
    const r = await settle();
    expect(r.gross).toBe(20400 * 만);
    expect(r.companyProfit).toBe(6288 * 만);
    expect(r.byRole(ROLES.DIV_HEAD)[0].totalPay).toBe(972 * 만); // 정확히 2배
  });

  it('S5 조직 완전체(마진 하한선): 총매출 3억6,000만 / 본사 1억92만 (마진 28.0%)', async () => {
    await seedOrg({
      regulars: { count: 52, revenue: 600 * 만 },
      teamLeaders: { count: 12, revenue: 400 * 만 },
      divHeads: { count: 2 },
      branchMgrs: { count: 1 },
    });
    const r = await settle();
    expect(r.gross).toBe(36000 * 만);
    expect(r.companyProfit).toBe(10092 * 만);
    for (const dh of r.byRole(ROLES.DIV_HEAD)) expect(dh.totalPay).toBe(876 * 만);
    expect(r.byRole(ROLES.BRANCH_MGR)[0].totalPay).toBe(876 * 만);
  });

  it('S6 안티프래질(저실적 80명 유입): 총매출 2억8,800만 / 본사 8,512만 (마진 29.6%)', async () => {
    await seedOrg({
      regulars: { count: 80, revenue: 300 * 만 },
      teamLeaders: { count: 12, revenue: 400 * 만 },
      divHeads: { count: 2 },
      branchMgrs: { count: 1 },
    });
    const r = await settle();
    expect(r.gross).toBe(28800 * 만);
    expect(r.companyProfit).toBe(8512 * 만);
    // 평사원 160만 — 시스템적 자동 필터링의 수치 근거
    for (const reg of r.byRole(ROLES.REGULAR)) expect(reg.totalPay).toBe(160 * 만);
    for (const dh of r.byRole(ROLES.DIV_HEAD)) expect(dh.totalPay).toBe(696 * 만);
  });

  it('S7 고인물/에이전시형: 총매출 9억2,000만 / 본사 2억7,300만 (마진 29.7%)', async () => {
    await seedOrg({
      regulars: { count: 20, revenue: 600 * 만 },
      teamLeaders: { count: 80, revenue: 1000 * 만 },
      divHeads: { count: 5 },
      branchMgrs: { count: 2 },
    });
    const r = await settle();
    expect(r.gross).toBe(92000 * 만);
    expect(r.companyProfit).toBe(27300 * 만);
    // 팀장 본인 영업 보상 640만 (1,000만 × 60% + 지원비 40만)
    for (const tl of r.byRole(ROLES.TEAM_LEADER)) expect(tl.basePay + tl.bonusPay).toBe(640 * 만);
    for (const dh of r.byRole(ROLES.DIV_HEAD)) expect(dh.totalPay).toBe(760 * 만);
    for (const bm of r.byRole(ROLES.BRANCH_MGR)) expect(bm.totalPay).toBe(950 * 만);
  });

  it('S8 제국 확장: 총매출 17억6,000만 / 본사 순이익 5억400만 (마진 28.6%)', async () => {
    await seedOrg({
      regulars: { count: 160, revenue: 600 * 만 },
      teamLeaders: { count: 80, revenue: 1000 * 만 },
      divHeads: { count: 6 },
      branchMgrs: { count: 2 },
    });
    const r = await settle();
    expect(r.gross).toBe(176000 * 만);
    // 시뮬레이션 문서의 '5억402만'은 본부장 평균(1,333.33만) 반올림 표기에서 온 오차.
    // 엔진의 정확한 값은 5억400만이다 (80,000-8,000-9,600-8,000-4,000 = 50,400만).
    expect(r.companyProfit).toBe(50400 * 만);
    // 팀장 평균 760만 (영업 640 + 오버 120): 사원 160명이 팀장 80명에 2명씩 균등 배속
    for (const tl of r.byRole(ROLES.TEAM_LEADER)) expect(tl.totalPay).toBe(760 * 만);
    for (const bm of r.byRole(ROLES.BRANCH_MGR)) expect(bm.totalPay).toBe(2000 * 만);
  });
});
