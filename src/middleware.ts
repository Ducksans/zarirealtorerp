import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

// Add paths that do NOT require authentication here
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/seed',
  '/_next',
  '/favicon.ico',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Allow public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path)) || pathname === '/') {
    return NextResponse.next();
  }

  // 2. Extract Session from JWT Cookie
  const sessionCookie = request.cookies.get('session')?.value;
  
  if (!sessionCookie) {
    // Redirect unauthenticated API requests
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Redirect unauthenticated Page requests to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 3. Verify JWT
    const session = await decrypt(sessionCookie);
    const user = session.user;

    // 4. RBAC (Role-Based Access Control) Enforcement logic
    // Currently relying on decoded JWT which contains user.role
    const role = user.role;

    // Example strict rule: Only ADMIN or CEO can access /admin routes
    if (pathname.startsWith('/admin')) {
      if (role !== 'ADMIN' && role !== 'CEO') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/app/dashboard', request.url));
      }
    }

    // Pass validated session data to downstream (e.g. Server Components) via headers if needed
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-role', user.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    // JWT Verification failed (Expired or Invalid)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Session expired or invalid' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
