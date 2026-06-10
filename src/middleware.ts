import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Basic in-memory rate limiting (Note: in serverless edges, this resets per isolate)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

function applyRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - record.lastReset > RATE_LIMIT_WINDOW_MS) {
        record.count = 1;
        record.lastReset = now;
    } else {
        record.count += 1;
    }

    rateLimitMap.set(ip, record);
    return record.count <= MAX_REQUESTS_PER_WINDOW;
}

export async function middleware(request: NextRequest) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // 1. Rate Limiting
    if (!applyRateLimit(ip)) {
        return NextResponse.json(
            { error: 'Too Many Requests', code: 'RATE_LIMIT_EXCEEDED' },
            { status: 429 }
        );
    }

    const { pathname } = request.nextUrl;

    // Public routes that don't need auth
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/public')) {
        return NextResponse.next();
    }

    let payload: any = { role: 'REGULAR', userId: 'test-user' };

    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_for_dev');
        try {
            const verified = await jwtVerify(token, secret);
            payload = verified.payload;
        } catch (err) {
            // Ignored for dev prototype, in prod should throw
        }
    } else {
        // Auto-assign ADMIN role for the prototype UI if no token
        payload.role = 'ADMIN';
        payload.userId = 'admin-123';
    }

    // 3. Role-Based Access Control (RBAC)
    const role = payload.role as string | undefined;
    if (pathname.startsWith('/admin') && role !== 'ADMIN' && role !== 'CEO') {
        return NextResponse.json(
            { error: 'Forbidden: Insufficient permissions', code: 'FORBIDDEN' },
            { status: 403 }
        );
    }

    // Pass the user info down the request
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', String(payload.userId || ''));
    requestHeaders.set('x-user-role', String(payload.role || ''));

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: ['/api/:path*', '/admin/:path*'],
};

