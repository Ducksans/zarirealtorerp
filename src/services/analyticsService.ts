/*---
id: analyticsService.ts
milestone: M0
why: 기본 구조 파일 (analyticsService.ts)
backlinks: []
---*/

/**
 * @file src/services/analyticsService.ts
 * @description 직원의 진급 및 실적 데이터를 분석하는 서비스
 */

import { prisma } from '@/lib/prisma';
import { ROLES } from '@/types';

/**
 * 특정 직원의 전체 누적 매출(부가세 제외 총액) 계산
 */
export async function getCumulativeSales(userId: string) {
  const result = await prisma.contract.aggregate({
    where: { agentId: userId },
    _sum: { grossCommission: true }
  });
  return result._sum.grossCommission || 0;
}

/**
 * 특정 직원의 특정 직급 진급 '이후' 누적 매출 계산
 * @param role 진급한 직급명 (예: TEAM_LEADER, DIV_HEAD)
 */
export async function getSalesAfterPromotion(userId: string, role: string) {
  // 해당 직급으로 진급한 시점을 찾는다
  const promotionRecord = await prisma.userRoleHistory.findFirst({
    where: { userId, role },
    orderBy: { promotedAt: 'asc' }
  });

  if (!promotionRecord) return 0; // 해당 직급으로 진급한 이력이 없으면 0

  // 진급 시점 이후의 계약만 합산
  const result = await prisma.contract.aggregate({
    where: {
      agentId: userId,
      contractDate: {
        gte: promotionRecord.promotedAt
      }
    },
    _sum: { grossCommission: true }
  });

  return result._sum.grossCommission || 0;
}

/**
 * 특정 직원의 월별 매출 추이 데이터 생성
 */
export async function getMonthlySalesTrend(userId: string, limitMonths: number = 12) {
  const contracts = await prisma.contract.findMany({
    where: { agentId: userId },
    orderBy: { contractDate: 'asc' }
  });

  // 월별로 그룹화 (YYYY-MM 포맷)
  const monthlyData: Record<string, number> = {};
  
  for (const contract of contracts) {
    const yearMonth = contract.contractDate.toISOString().substring(0, 7); // YYYY-MM
    if (!monthlyData[yearMonth]) monthlyData[yearMonth] = 0;
    monthlyData[yearMonth] += contract.grossCommission;
  }

  // 최신 limitMonths 개월만 추출
  const sortedMonths = Object.keys(monthlyData).sort();
  const recentMonths = sortedMonths.slice(-limitMonths);

  return recentMonths.map(month => ({
    month,
    sales: monthlyData[month]
  }));
}
