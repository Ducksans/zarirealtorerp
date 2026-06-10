/*---
id: middleware.ts
milestone: M0
why: 기본 구조 파일 (middleware.ts)
backlinks: []
---*/

/**
 * @id DevSecurityMiddleware
 * @milestone M16
 * @why /dev 대시보드에 대표개발자 외의 접근을 원천 차단하기 위한 보안 미들웨어
 * @backlinks [[M16_Neural_Sync_Master.md]]
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /dev(관제탑)와 /admin(관리자 화면) 경로를 보호합니다.
  // [M2 선행 가드] 실제 세션 기반 RBAC는 Work_Queue #5(M2 인증)에서 교체 예정.
  // 프로덕션이 아닌 로컬 환경에서는 개발 편의를 위해 접속을 허용합니다 (대표님 지시).
  if (pathname.startsWith('/dev') || pathname.startsWith('/admin')) {
    const masterKey = request.cookies.get('MASTER_SYNC_KEY');
    const isLocal = process.env.NODE_ENV !== 'production';

    if (!isLocal && (!masterKey || masterKey.value !== 'deoksan-neural-sync-2026')) {
      console.warn(`⚠️ [보안 경고] 비인가자의 ${pathname} 접근 시도 차단됨`);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// 미들웨어가 작동할 경로를 명시적으로 지정합니다.
export const config = {
  matcher: ['/dev/:path*', '/admin/:path*'],
};
