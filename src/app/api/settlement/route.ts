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
import { z } from 'zod';

const RunSettlementSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'yearMonth는 YYYY-MM 형식이어야 합니다.').optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const validated = RunSettlementSchema.parse(body);
    const yearMonth = validated.yearMonth ?? getCurrentYearMonth();

    const settlements = await processMonthlySettlement(yearMonth);
    return NextResponse.json({ message: 'Settlement processed successfully', yearMonth, count: settlements.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map(e => e.message).join(', ') }, { status: 400 });
    }
    return handleError(error);
  }
}
