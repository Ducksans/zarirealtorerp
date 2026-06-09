import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/errorHandler';

export async function GET() {
  try {
    // 1. 핵심 지표: 활성 사원 수
    const activeAgentsCount = await prisma.user.count({
      where: { status: 'ACTIVE' }
    });

    // 2. 대기 중인 결재/계약 건수 (예: signatureStatus가 PENDING인 계약)
    const pendingContractsCount = await prisma.contract.count({
      where: { signatureStatus: 'PENDING' }
    });

    // 3. 전사 누적 매출 (모든 계약의 grossCommission 합)
    const totalRevenueAgg = await prisma.contract.aggregate({
      _sum: { grossCommission: true }
    });
    const totalRevenue = totalRevenueAgg._sum.grossCommission || 0;

    // 4. 전사 월별 매출 추이
    const contracts = await prisma.contract.findMany({
      orderBy: { contractDate: 'asc' },
      select: { contractDate: true, grossCommission: true }
    });

    const monthlyData: Record<string, number> = {};
    for (const contract of contracts) {
      const yearMonth = contract.contractDate.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[yearMonth]) monthlyData[yearMonth] = 0;
      monthlyData[yearMonth] += contract.grossCommission;
    }

    const sortedMonths = Object.keys(monthlyData).sort();
    // 최근 12개월 추출
    const recentMonths = sortedMonths.slice(-12);
    const monthlyTrend = recentMonths.map(month => ({
      month,
      revenue: monthlyData[month]
    }));

    // 5. 이달의 Top 매출 사원 리더보드
    // 단순히 이번 달 계약 기준 랭킹 계산
    const currentYearMonth = new Date().toISOString().substring(0, 7);
    const thisMonthContracts = await prisma.contract.findMany({
      where: {
        contractDate: {
          gte: new Date(`${currentYearMonth}-01T00:00:00Z`),
          lt: new Date(new Date(`${currentYearMonth}-01T00:00:00Z`).setMonth(new Date().getMonth() + 1))
        }
      },
      include: {
        agent: { select: { id: true, name: true, employeeId: true, role: true } }
      }
    });

    const agentSales: Record<string, { agent: any, total: number }> = {};
    for (const c of thisMonthContracts) {
      if (!agentSales[c.agentId]) {
        agentSales[c.agentId] = { agent: c.agent, total: 0 };
      }
      agentSales[c.agentId].total += c.grossCommission;
    }

    const leaderboard = Object.values(agentSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5) // Top 5
      .map((entry, index) => ({
        rank: index + 1,
        ...entry.agent,
        sales: entry.total
      }));

    return NextResponse.json({
      metrics: {
        activeAgents: activeAgentsCount,
        pendingContracts: pendingContractsCount,
        totalRevenue
      },
      monthlyTrend,
      leaderboard
    });
  } catch (error) {
    return handleError(error);
  }
}
