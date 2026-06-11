/*---
id: auth.ts
milestone: M2
why: 실인증 핵심 유틸 (비밀번호 해시 + HMAC 세션 토큰)
backlinks: [[M2_Auth]]
---*/

/**
 * @file src/lib/auth.ts
 * @description 세션 토큰 발급/검증 및 비밀번호 해시 유틸리티
 * @dependencies Node crypto (내장만 사용 — bcrypt 등 외부 패키지 금지)
 * @purpose 가짜 로그인(EMP-0000/diamond)을 대체하는 실제 세션 인증의 단일 출처.
 *          - 비밀번호: crypto.scryptSync + 랜덤 salt (timingSafeEqual 비교)
 *          - 세션: HMAC-SHA256 서명 토큰 (payload: userId, role, exp 7일)
 */

import crypto from 'crypto';

// ⚠️ 프로덕션에서는 반드시 환경변수 SESSION_SECRET로 교체할 것 (기본값은 개발/데모 전용)
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'zari-dev-secret-CHANGE-IN-PROD';

/** 세션 쿠키 이름 (httpOnly) */
export const SESSION_COOKIE_NAME = 'zari_session';

/** 세션 유효기간: 7일 */
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface SessionPayload {
  userId: string;
  role: string;
  /** 만료 시각 (Unix epoch ms) */
  exp: number;
}

const SCRYPT_KEYLEN = 64;

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function hmac(data: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
}

// -----------------------------------------
// 비밀번호 해시 (scrypt + salt)
// -----------------------------------------

/** 비밀번호를 `scrypt:<salt>:<hash>` 형식으로 해시합니다. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

/** 저장된 해시(`scrypt:<salt>:<hash>`)와 입력 비밀번호를 타이밍 안전 비교합니다. */
export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hashHex] = parts;
  try {
    const expected = Buffer.from(hashHex, 'hex');
    const candidate = crypto.scryptSync(password, salt, expected.length);
    return crypto.timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

// -----------------------------------------
// HMAC 서명 세션 토큰 (`<base64url(payload)>.<base64url(hmac)>`)
// -----------------------------------------

/** 세션 토큰을 발급합니다. exp는 기본 7일 후. */
export function createSessionToken(
  payload: Omit<SessionPayload, 'exp'>,
  ttlSeconds: number = SESSION_TTL_SECONDS
): string {
  const full: SessionPayload = { ...payload, exp: Date.now() + ttlSeconds * 1000 };
  const body = base64url(JSON.stringify(full));
  return `${body}.${hmac(body)}`;
}

/** 토큰의 HMAC 서명·만료를 검증하고, 유효하면 payload를 반환합니다 (무효 시 null). */
export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex <= 0) return null;

  const body = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  const expected = hmac(body);

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (
      typeof payload.userId !== 'string' ||
      typeof payload.role !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }
    if (payload.exp < Date.now()) return null; // 만료
    return payload;
  } catch {
    return null;
  }
}

/** Route Handler 응답에 세션 쿠키를 설정할 때 쓰는 공통 옵션 */
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: SESSION_TTL_SECONDS,
};
