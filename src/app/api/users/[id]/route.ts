/*---
id: route.ts
milestone: M0
why: API 라우트 엔드포인트 (route.ts)
backlinks: [[[API_Routes]]]
---*/

import { NextResponse } from 'next/server';
import { getUserById, updateUser, deleteUser } from '@/services/userService';
import { getCumulativeSales, getSalesAfterPromotion, getMonthlySalesTrend } from '@/services/analyticsService';
import { handleError } from '@/lib/errorHandler';
import { ROLES } from '@/types';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserById(params.id);
    
    // 분석 데이터 추가 연산
    const totalSales = await getCumulativeSales(user.id);
    const tlSales = await getSalesAfterPromotion(user.id, ROLES.TEAM_LEADER);
    const dhSales = await getSalesAfterPromotion(user.id, ROLES.DIV_HEAD);
    const bmSales = await getSalesAfterPromotion(user.id, ROLES.BRANCH_MGR);
    const monthlyTrend = await getMonthlySalesTrend(user.id);

    return NextResponse.json({
      ...user,
      analytics: {
        totalSales,
        salesAfterTeamLeader: tlSales,
        salesAfterDivHead: dhSales,
        salesAfterBranchMgr: bmSales,
        monthlyTrend
      }
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const reason = body.reason || '관리자 정보 수정';
    const updated = await updateUser(params.id, body.data, 'SYSTEM', reason);
    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const reason = body.reason || '직원 퇴사 처리';
    await deleteUser(params.id, 'SYSTEM', reason);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
