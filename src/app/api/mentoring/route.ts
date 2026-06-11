/*---
id: mentoring_api
milestone: M17
why: 멘토링 대시보드 데이터 공급 — 팀장/본부장이 "이 멘티가 나에게 만들어준 오버라이딩"을 멘티별로 확인하도록 직속 다운라인 실적 + 오버라이딩(100원 룰 공유 코어)을 한 번에 응답
backlinks: [[mentoring_page]], [[SSOT_Commission_100won_Rule.md]], [[home_api]]
---*/

/**
 * @file src/app/api/mentoring/route.ts
 * @description M17 멘토링 대시보드 API — GET ?userId=&yearMonth=
 * @purpose 직속 다운라인 각각의 이번 달 매출/건수/전월 매출/마지막 계약일과
 *          내가 받는 오버라이딩(팀장: 회사귀속분×20%, 본부장: ×10% — commissionBreakdown 규칙과 일치)을 집계.
 *          오버라이딩은 회사 귀속분에서 지급 — 멘티 몫 불변.
 */

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

/**
 * 멘토(viewer) 직급 기준, 멘티 한 명의 매출(gross)이 나에게 만들어주는 오버라이딩.
 * breakdownGross의 shares를 그대로 사용해 정산 엔진과 규칙 일치를 보증한다:
 *  - 팀장 → 사원 멘티의 회사귀속분 × 20% (teamLeader share)
 *  - 본부장 → 사원·팀장 멘티의 회사귀속분 × 10% (divHead share)
 *  - 그 외(지점장 풀 5%는 전사 분배라 제외) → 0
 */
function overrideToMentor(viewerRole: string, menteeRole: string, gross: number): number {
  if (gross <= 0) return 0;
  const shares = breakdownGross(menteeRole, gross).shares;
  if (viewerRole === ROLES.TEAM_LEADER) {
    return shares.find((s) => s.key === 'teamLeader')?.amount ?? 0;
  }
  if (viewerRole === ROLES.DIV_HEAD) {
    return shares.find((s) => s.key === 'divHead')?.amount ?? 0;
  }
  return 0;
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

    const downlines = await prisma.user.findMany({
      where: { uplineId: userId, status: 'ACTIVE' },
      select: { id: true, name: true, role: true, employeeId: true },
      orderBy: { joinedAt: 'asc' },
    });
    const ids = downlines.map((d) => d.id);

    const thisRange = monthRange(yearMonth);
    const lastStart = new Date(thisRange.gte);
    lastStart.setUTCMonth(lastStart.getUTCMonth() - 1);
    const lastRange = { gte: lastStart, lt: thisRange.gte };

    // 멘티별 집계 3종: 이번 달(합/건수/월내 마지막 계약일), 전월 합, 전체 마지막 계약일
    const [thisAgg, lastAgg, lastContractAgg] = ids.length === 0
      ? [[], [], []]
      : await Promise.all([
          prisma.contract.groupBy({
            by: ['agentId'],
            where: { agentId: { in: ids }, contractDate: thisRange },
            _sum: { grossCommission: true },
            _count: { _all: true },
          }),
          prisma.contract.groupBy({
            by: ['agentId'],
            where: { agentId: { in: ids }, contractDate: lastRange },
            _sum: { grossCommission: true },
          }),
          prisma.contract.groupBy({
            by: ['agentId'],
            where: { agentId: { in: ids } },
            _max: { contractDate: true },
          }),
        ]);

    const thisMap = new Map(thisAgg.map((a) => [a.agentId, a]));
    const lastMap = new Map(lastAgg.map((a) => [a.agentId, a._sum.grossCommission ?? 0]));
    const lastContractMap = new Map(lastContractAgg.map((a) => [a.agentId, a._max.contractDate]));

    const rows = downlines.map((d) => {
      const t = thisMap.get(d.id);
      const gross = t?._sum.grossCommission ?? 0;
      const contractCount = t?._count._all ?? 0;
      const lastMonthGross = lastMap.get(d.id) ?? 0;
      const lastContractDate = lastContractMap.get(d.id) ?? null;
      return {
        id: d.id,
        name: d.name,
        role: d.role,
        employeeId: d.employeeId,
        gross,
        contractCount,
        lastMonthGross,
        overrideToMe: overrideToMentor(user.role, d.role, gross),
        lastContractDate,
      };
    });

    const totals = rows.reduce(
      (acc, r) => ({
        gross: acc.gross + r.gross,
        contractCount: acc.contractCount + r.contractCount,
        lastMonthGross: acc.lastMonthGross + r.lastMonthGross,
        overrideToMe: acc.overrideToMe + r.overrideToMe,
      }),
      { gross: 0, contractCount: 0, lastMonthGross: 0, overrideToMe: 0 }
    );

    return NextResponse.json({
      user,
      yearMonth,
      downlines: rows,
      totals,
    });
  } catch (error) {
    return handleError(error);
  }
}
