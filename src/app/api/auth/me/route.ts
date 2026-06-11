/*---
id: route.ts
milestone: M2
why: 현재 세션 사용자 조회 API
backlinks: [[M2_Auth]]
---*/

/**
 * @file src/app/api/auth/me/route.ts
 * @description GET /api/auth/me — zari_session 쿠키를 검증하고 현재 사용자 반환
 * @dependencies prisma, lib/auth, next/headers cookies
 * @purpose 프록시는 쿠키 존재만 확인하므로, 실제 서명/만료 검증과 사용자 조회는 여기서 수행.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { handleError, AppError } from '@/lib/errorHandler';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = verifySessionToken(token);
    if (!session) {
      throw new AppError('인증이 필요합니다.', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('인증이 필요합니다.', 401);
    }

    return NextResponse.json({
      user: { id: user.id, name: user.name, role: user.role, employeeId: user.employeeId },
    });
  } catch (error) {
    return handleError(error);
  }
}
