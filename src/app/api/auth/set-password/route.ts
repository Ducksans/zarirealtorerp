/*---
id: route.ts
milestone: M2
why: 최초 비밀번호 설정 API (본인 확인: 생년월일)
backlinks: [[M2_Auth]]
---*/

/**
 * @file src/app/api/auth/set-password/route.ts
 * @description POST /api/auth/set-password — passwordHash 미설정 계정의 최초 비밀번호 설정
 * @dependencies prisma, lib/auth, auditService, zod
 * @purpose 비밀번호 미설정(needsSetup) 계정이 본인 확인 후 비밀번호를 만들고 자동 로그인.
 *          ⚠️ 본인 확인은 birthDate(YYYY-MM-DD) 일치로 처리 — 전화(SMS) 인증 도입 전 임시 정책.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError, AppError } from '@/lib/errorHandler';
import { createAuditLog } from '@/services/auditService';
import {
  hashPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from '@/lib/auth';

const SetPasswordSchema = z.object({
  employeeId: z.string().min(1, '사번을 입력해 주세요.'),
  // 생년월일은 선택 입력: birthDate가 등록되지 않은 더미/시드 계정은 검증을 생략하므로
  // 클라이언트가 빈 값으로 보낼 수 있다.
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '생년월일은 YYYY-MM-DD 형식으로 입력해 주세요.')
    .optional(),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = SetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      // zod v4: error.issues 사용
      throw new AppError(parsed.error.issues[0]?.message ?? '잘못된 요청입니다.', 400);
    }

    const { employeeId, birthDate, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { employeeId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('해당 사번의 재직 중인 계정을 찾을 수 없습니다.', 404);
    }

    // 이미 비밀번호가 설정된 계정은 이 경로로 변경 불가 (탈취 방지)
    if (user.passwordHash) {
      throw new AppError('이미 비밀번호가 설정된 계정입니다. 로그인해 주세요.', 400);
    }

    // 임시 본인 확인 정책: 등록된 생년월일(YYYY-MM-DD) 일치 여부로 확인.
    // ⚠️ birthDate가 null인 더미/시드 계정은 대조할 원본이 없으므로 생년월일 검증을 생략한다.
    //    (실직원 계정은 온보딩에서 birthDate 필수 입력 → 반드시 일치 검증을 거침)
    // TODO(M2 후속): 전화(SMS) 인증으로 교체 예정.
    if (user.birthDate && user.birthDate !== birthDate) {
      throw new AppError('본인 확인에 실패했습니다. 생년월일을 확인해 주세요.', 403);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(password) },
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'USER',
      entityId: user.id,
      actorId: user.employeeId,
      afterData: { passwordSet: true }, // 해시 원문은 감사 로그에 남기지 않음
      reason: '최초 비밀번호 설정',
    });

    // 설정 성공 → 자동 로그인 쿠키 발급
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
