/*---
id: card_api
milestone: M15
why: 스마트 명함 공개 API — 고객이 받는 링크이므로 개인정보(전화/주소/계좌)는 절대 노출하지 않고, 시스템이 보증하는 실적(계약·인증매물)만 응답
backlinks: [[card_page]], [[trust_page]]
---*/

/**
 * @file src/app/api/card/[employeeId]/route.ts
 * @description M15 스마트 명함 데이터 API (공개)
 * @purpose employeeId(unique)로 ACTIVE 직원 조회 — name/role/employeeId/joinedAt만 노출.
 *          이번 달·누적 계약 건수 + 인증매물 수(ownerVerified)를 함께 응답한다.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError, AppError } from '@/lib/errorHandler';
import { getCurrentYearMonth } from '@/lib/utils';

/** yearMonth(YYYY-MM)의 UTC 월 경계 [시작, 다음달 1일) */
function monthRange(yearMonth: string): { gte: Date; lt: Date } {
  const start = new Date(`${yearMonth}-01T00:00:00Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { gte: start, lt: end };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params;
    if (!employeeId) throw new AppError('employeeId가 필요합니다.', 400);

    // 공개 명함: 개인정보(전화/주소/계좌/생년월일) 제외 — 노출 필드 화이트리스트
    const user = await prisma.user.findUnique({
      where: { employeeId },
      select: { id: true, name: true, role: true, employeeId: true, joinedAt: true, status: true },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('명함을 찾을 수 없습니다.', 404);
    }

    const thisRange = monthRange(getCurrentYearMonth());

    const [thisMonthContracts, totalContracts, verifiedProperties] = await Promise.all([
      prisma.contract.count({ where: { agentId: user.id, contractDate: thisRange } }),
      prisma.contract.count({ where: { agentId: user.id } }),
      prisma.property.count({ where: { agentId: user.id, ownerVerified: true } }),
    ]);

    return NextResponse.json({
      name: user.name,
      role: user.role,
      employeeId: user.employeeId,
      joinedAt: user.joinedAt,
      stats: { thisMonthContracts, totalContracts, verifiedProperties },
    });
  } catch (error) {
    return handleError(error);
  }
}
