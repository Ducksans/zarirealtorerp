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
  // 1. /dev 경로로 시작하는 모든 요청을 가로챕니다.
  if (request.nextUrl.pathname.startsWith('/dev')) {
    
    // 2. 임시 인증 로직: 쿠키나 헤더에 마스터 키가 있는지 확인합니다.
    // (실제 프로덕션에서는 JWT 토큰이나 세션 검증 로직이 들어갑니다.)
    const masterKey = request.cookies.get('MASTER_SYNC_KEY');
    
    // 3. 로컬 환경 개발 편의를 위한 인증 하향 (대표님 지시)
    // 프로덕션(배포) 환경이 아닐 경우(로컬) 즉각 접속을 허용합니다.
    const isLocal = process.env.NODE_ENV !== 'production';
    
    if (!isLocal && (!masterKey || masterKey.value !== 'deoksan-neural-sync-2026')) {
      console.warn('⚠️ [보안 경고] 비인가자의 /dev 대시보드 접근 시도 차단됨');
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// 미들웨어가 작동할 경로를 명시적으로 지정합니다.
export const config = {
  matcher: ['/dev/:path*'],
};
