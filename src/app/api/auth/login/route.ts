/*---
id: route.ts
milestone: M2
why: 실인증 로그인 API (사번 + 비밀번호 → HMAC 세션 쿠키)
backlinks: [[M2_Auth]]
---*/

/**
 * @file src/app/api/auth/login/route.ts
 * @description POST /api/auth/login — 사번/비밀번호 검증 후 zari_session 쿠키 발급
 * @dependencies prisma, lib/auth, zod
 * @purpose 데모 하드코딩(EMP-0000/diamond)을 대체하는 실제 로그인 엔드포인트.
 *          passwordHash 미설정 계정에는 needsSetup을 응답해 최초 설정 플로우로 유도.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError, AppError } from '@/lib/errorHandler';
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from '@/lib/auth';

const LoginSchema = z.object({
  employeeId: z.string().min(1, '사번을 입력해 주세요.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      // zod v4: error.issues 사용
      throw new AppError(parsed.error.issues[0]?.message ?? '잘못된 요청입니다.', 400);
    }

    const { employeeId, password } = parsed.data;

    // 재직(ACTIVE) 사용자만 로그인 가능
    const user = await prisma.user.findUnique({ where: { employeeId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('사번 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    // 비밀번호 미설정 계정 → 최초 비밀번호 설정 플로우로 유도
    if (!user.passwordHash) {
      return NextResponse.json({ needsSetup: true });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      throw new AppError('사번 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    const token = createSessionToken({ userId: user.id, role: user.role });
    const res = NextResponse.json({
      user: { id: user.id, name: user.name, role: user.role, employeeId: user.employeeId },
    });
    res.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
    return res;
  } catch (error) {
    return handleError(error);
  }
}
