/*---
id: route.ts
milestone: M0
why: API 라우트 엔드포인트 (route.ts)
backlinks: [[[API_Routes]]]
---*/

/**
 * @file src/app/api/settlement/route.ts
 * @description 월간 마감 및 정산 실행 API 엔드포인트 (Controller)
 * @dependencies settlementService, errorHandler, utils
 * @purpose 정산 서비스 로직 호출 및 클라이언트 응답 전담
 * @audit-fixes HIGH-04(yearMonth 동적화)
 */

import { NextResponse } from 'next/server';
import { processMonthlySettlement } from '@/lib/settlementService';
import { handleError } from '@/lib/errorHandler';
import { getCurrentYearMonth } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const yearMonth = getCurrentYearMonth();
    const settlements = await processMonthlySettlement(yearMonth);
    return NextResponse.json({ message: 'Settlement processed successfully', count: settlements.length });
  } catch (error) {
    return handleError(error);
  }
}
