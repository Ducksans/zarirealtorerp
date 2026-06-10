/*---
id: home_api
milestone: M10
why: 영업사원 모바일 홈 피드의 데이터 공급 — "이번 달 내가 받을 돈"을 첫 숫자로 보여주기 위해 본인 영업분(100원 룰 분해) + 오버라이딩 예상 수입 + 확정 정산서를 한 번에 응답
backlinks: [[SSOT_Commission_100won_Rule.md]], [[transparency_api]]
---*/

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError, AppError } from '@/lib/errorHandler';
import { breakdownGross } from '@/lib/commissionBreakdown';
import { getCurrentYearMonth } from '@/lib/utils';
import { ROLES } from '@/types';

/** yearMonth(YYYY-MM)의 UTC 월 경계 [시작, 다음달 1일) */
function monthRange(yearMonth: string): { gte: Date; lt: Date } {
  const start = new Date(`${yearMonth}-01T00:00:00Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { gte: start, lt: end };
}

/** 해당 기간 본인 계약 매출 합 */
async function sumGross(agentIds: string[], range: { gte: Date; lt: Date }): Promise<number> {
  if (agentIds.length === 0) return 0;
  const agg = await prisma.contract.aggregate({
    where: { agentId: { in: agentIds }, contractDate: range },
    _sum: { grossCommission: true },
  });
  return agg._sum.grossCommission ?? 0;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const yearMonth = url.searchParams.get('yearMonth') || getCurrentYearMonth();
    if (!userId) throw new AppError('userId가 필요합니다.', 400);
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) throw new AppError('yearMonth 형식은 YYYY-MM 입니다.', 400);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, employeeId: true },
    });
    if (!user) throw new AppError('직원을 찾을 수 없습니다.', 404);

    const thisRange = monthRange(yearMonth);
    const lastStart = new Date(thisRange.gte);
    lastStart.setUTCMonth(lastStart.getUTCMonth() - 1);
    const lastRange = { gte: lastStart, lt: thisRange.gte };

    // 이달 본인 계약 (실데이터) — 합계 + 최근 5건
    const contracts = await prisma.contract.findMany({
      where: { agentId: userId, contractDate: thisRange },
      select: { id: true, grossCommission: true, contractDate: true, propertyAddress: true, contractType: true },
      orderBy: { contractDate: 'desc' },
    });
    const gross = contracts.reduce((s, c) => s + c.grossCommission, 0);
    const lastGross = await sumGross([userId], lastRange);

    // 100원 룰 분해 (정산 엔진과 동일 규칙 — 테스트로 상호 보증)
    const breakdown = breakdownGross(user.role, gross);

    // 해당 월 확정 정산서 (있다면)
    const settlement = await prisma.settlement.findFirst({
      where: { userId, yearMonth },
      select: {
        id: true, basePay: true, bonusPay: true, overridePay: true, totalPay: true,
        signatureStatus: true, paymentStatus: true,
      },
    });

    // 직속 다운라인 + 오버라이딩 예상 수입 (관리자만 의미 있음)
    const directDownlines = await prisma.user.findMany({
      where: { uplineId: userId, status: 'ACTIVE' },
      select: { id: true, role: true },
    });
    const downlineCount = directDownlines.length;

    let overrideIncome = 0;
    if (user.role === ROLES.TEAM_LEADER) {
      // 직속 사원의 이달 매출 × 50%(회사귀속분) × 20%
      const regularIds = directDownlines.filter(d => d.role === ROLES.REGULAR).map(d => d.id);
      const teamGross = await sumGross(regularIds, thisRange);
      overrideIncome = Math.floor(teamGross * 0.5 * 0.2);
    } else if (user.role === ROLES.DIV_HEAD) {
      // 산하 팀장(compRev = gross×40%) + 그 팀장들의 사원(compRev = gross×50%)의 회사귀속분 합 × 10%
      const tlIds = directDownlines.filter(d => d.role === ROLES.TEAM_LEADER).map(d => d.id);
      const tlGross = await sumGross(tlIds, thisRange);
      const regulars = tlIds.length > 0
        ? await prisma.user.findMany({
            where: { uplineId: { in: tlIds }, role: ROLES.REGULAR, status: 'ACTIVE' },
            select: { id: true },
          })
        : [];
      const regGross = await sumGross(regulars.map(r => r.id), thisRange);
      overrideIncome = Math.floor((tlGross * 0.4 + regGross * 0.5) * 0.1);
    }
    // BRANCH_MGR: 풀 분배는 전사 계산이라 생략(0), REGULAR: 0

    return NextResponse.json({
      user,
      yearMonth,
      thisMonth: { gross, contractCount: contracts.length, breakdown },
      lastMonth: { gross: lastGross },
      settlement,
      overrideIncome,
      downlineCount,
      recentContracts: contracts.slice(0, 5),
    });
  } catch (error) {
    return handleError(error);
  }
}
