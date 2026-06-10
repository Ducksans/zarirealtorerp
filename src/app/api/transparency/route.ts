/*---
id: transparency_api
milestone: M9
why: 100원 분해 추적기의 데이터 공급 — 특정 직원의 월간 매출이 누구에게 얼마씩 흘렀는지 실데이터로 응답
backlinks: [[SSOT_Commission_100won_Rule.md]]
---*/

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError, AppError } from '@/lib/errorHandler';
import { breakdownGross } from '@/lib/commissionBreakdown';
import { getCurrentYearMonth } from '@/lib/utils';
import { ROLES } from '@/types';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const yearMonth = url.searchParams.get('yearMonth') || getCurrentYearMonth();
    if (!userId) throw new AppError('userId가 필요합니다.', 400);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, employeeId: true, uplineId: true },
    });
    if (!user) throw new AppError('직원을 찾을 수 없습니다.', 404);

    // 업라인 체인 수집 (최대 5단계 방어)
    const chain: { id: string; name: string; role: string }[] = [];
    let cursor = user.uplineId;
    for (let i = 0; i < 5 && cursor; i++) {
      const up = await prisma.user.findUnique({
        where: { id: cursor },
        select: { id: true, name: true, role: true, uplineId: true },
      });
      if (!up) break;
      chain.push({ id: up.id, name: up.name, role: up.role });
      cursor = up.uplineId;
    }
    const teamLeader = chain.find(c => c.role === ROLES.TEAM_LEADER) ?? null;
    const divHead = chain.find(c => c.role === ROLES.DIV_HEAD) ?? null;
    const branchMgrs = await prisma.user.findMany({
      where: { role: ROLES.BRANCH_MGR, status: 'ACTIVE' },
      select: { id: true, name: true },
    });

    // 해당 월 본인 계약 (실데이터)
    const monthStart = new Date(`${yearMonth}-01T00:00:00Z`);
    const monthEnd = new Date(monthStart);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
    const contracts = await prisma.contract.findMany({
      where: { agentId: userId, contractDate: { gte: monthStart, lt: monthEnd } },
      select: { id: true, grossCommission: true, contractDate: true, propertyAddress: true, contractType: true },
      orderBy: { contractDate: 'asc' },
    });
    const gross = contracts.reduce((s, c) => s + c.grossCommission, 0);

    // 100원 룰 분해 (정산 엔진과 동일 규칙 — 테스트로 상호 보증)
    const breakdown = breakdownGross(user.role, gross);

    // 해당 월 확정 정산서 (있다면)
    const settlement = await prisma.settlement.findFirst({
      where: { userId, yearMonth },
      select: { basePay: true, bonusPay: true, overridePay: true, totalPay: true, signatureStatus: true, paymentStatus: true },
    });

    return NextResponse.json({
      yearMonth,
      user: { id: user.id, name: user.name, role: user.role, employeeId: user.employeeId },
      recipients: { teamLeader, divHead, branchMgrCount: branchMgrs.length, branchMgrs: branchMgrs.slice(0, 5) },
      contracts,
      gross,
      breakdown,
      settlement,
    });
  } catch (error) {
    return handleError(error);
  }
}
