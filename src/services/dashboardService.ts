/*---
id: dashboardService.ts
milestone: M0
why: 기본 구조 파일 (dashboardService.ts)
backlinks: []
---*/

/**
 * @file src/services/dashboardService.ts
 * @description 대시보드 통계 데이터 조회 비즈니스 로직
 * @dependencies prisma (싱글턴)
 * @purpose Controller에서 DB 직접 접근을 제거하고 Service Layer로 이관 (HIGH-01 수정)
 * @audit-fixes HIGH-01(SRP 위반), HIGH-02(aggregate 최적화)
 */

import { prisma } from '@/lib/prisma';

export async function getDashboardData(search: string, yearMonth: string) {
  const settlements = await prisma.settlement.findMany({
    where: {
      yearMonth,
      user: {
        OR: [
          { name: { contains: search } },
          { employeeId: { contains: search } }
        ]
      }
    },
    include: {
      user: { select: { name: true, role: true, employeeId: true } }
    },
    orderBy: { totalPay: 'desc' }
  });

  // HIGH-02: aggregate로 DB엔진이 SUM 수행 (O(1) 네트워크)
  const aggregation = await prisma.contract.aggregate({
    _sum: { grossCommission: true }
  });
  const totalGross = aggregation._sum.grossCommission || 0;

  return { settlements, totalGross };
}
