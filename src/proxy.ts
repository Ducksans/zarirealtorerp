/*---
id: proxy.ts
milestone: M2
why: 보호 경로 진입 가드 (세션 쿠키 낙관적 검사)
backlinks: [[M2_Auth]]
---*/

/**
 * @file src/proxy.ts
 * @description 보호 경로(루트 '/', /admin, /dev, /hr, /home, /crm, /properties, /customers, /schedule)
 *              진입 시 세션 쿠키 가드
 * @dependencies next/server, lib/auth (쿠키 이름 상수)
 * @purpose Next.js 16에서 middleware.ts가 deprecated → proxy.ts로 마이그레이션 (기능 동일).
 *          - 여기서는 zari_session 쿠키 '존재 여부'만 확인하는 낙관적 검사를 수행.
 *            (HMAC 서명/만료 검증은 Next.js 권고 — "프록시를 완전한 세션 검증 수단으로
 *             쓰지 말 것" — 에 따라 API 라우트(/api/auth/me 등)에서 수행)
 *          - 기본값: 보호 활성 (대표 지시 — 루트 접속 시 로그인부터).
 *            process.env.AUTH_ENFORCE === '0' 일 때만 전면 통과 (데모/시연용 임시 해제).
 *          - 공개 경로: /login, /onboarding, /trust, /showcase, /web, /rulebook,
 *            /api/auth/*, /_next, 정적 자원 → matcher에 포함시키지 않으며,
 *            방어적으로 코드에서도 한 번 더 통과 처리한다.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

/** 인증 없이 접근 가능한 공개 경로 prefix (matcher와 별개로 방어적 이중 체크) */
const PUBLIC_PREFIXES = [
  '/login',
  '/onboarding',
  '/trust',
  '/showcase',
  '/web',
  '/rulebook',
  '/api/auth',
  '/_next',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function proxy(request: NextRequest) {
  // 인증 해제 모드: AUTH_ENFORCE=0 일 때만 전면 통과 (기본값은 보호 활성)
  if (process.env.AUTH_ENFORCE === '0') {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  // 공개 경로·정적 자원은 통과 (matcher에서 이미 제외되지만 방어적으로 한 번 더)
  if (isPublicPath(pathname) || /\.[^/]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // 낙관적 검사: 쿠키 존재 여부만 확인 (서명/만료 검증은 API 라우트에서)
  if (!request.cookies.has(SESSION_COOKIE_NAME)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 보호할 경로만 명시: 루트 '/' + 주요 업무 구역 (정적 자산·공개 경로는 프록시를 타지 않음)
export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/dev/:path*',
    '/hr/:path*',
    '/home/:path*',
    '/crm/:path*',
    '/properties/:path*',
    '/customers/:path*',
    '/schedule/:path*',
  ],
};
