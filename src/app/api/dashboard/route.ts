/**
 * @file src/app/api/dashboard/route.ts
 * @description 대시보드 데이터 조회 API 엔드포인트 (Controller)
 * @dependencies dashboardService, errorHandler, utils
 * @purpose HTTP 요청 파싱 및 응답 포맷팅 전담 (DB 직접 접근 제거)
 * @audit-fixes HIGH-01(SRP), HIGH-04(yearMonth 동적화)
 */

import { NextResponse } from 'next/server';
import { getDashboardData } from '@/services/dashboardService';
import { handleError } from '@/lib/errorHandler';
import { getCurrentYearMonth } from '@/lib/utils';
import { z } from 'zod';

const DashboardQuerySchema = z.object({
  search: z.string().optional(),
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid yearMonth format').optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = {
      search: url.searchParams.get('search') || '',
      yearMonth: url.searchParams.get('yearMonth') || getCurrentYearMonth(),
    };
    
    const validated = DashboardQuerySchema.parse(query);

    const { settlements, totalGross } = await getDashboardData(validated.search || '', validated.yearMonth || getCurrentYearMonth());

    return NextResponse.json({ settlements, totalGross });
  } catch (error) {
    return handleError(error);
  }
}
