/*---
id: route.ts
milestone: M2
why: 로그아웃 API (세션 쿠키 제거)
backlinks: [[M2_Auth]]
---*/

/**
 * @file src/app/api/auth/logout/route.ts
 * @description POST /api/auth/logout — zari_session 쿠키 삭제
 * @dependencies lib/auth
 * @purpose 클라이언트 세션 종료. 토큰은 상태 비저장(HMAC)이므로 쿠키 제거로 충분.
 */

import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}
