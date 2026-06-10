/*---
id: prisma.ts
milestone: M0
why: 기본 구조 파일 (prisma.ts)
backlinks: []
---*/

/**
 * @file src/lib/prisma.ts
 * @description PrismaClient 싱글턴 인스턴스 관리
 * @purpose HMR 환경에서 커넥션 풀 누수를 방지하기 위한 글로벌 싱글턴 (CRITICAL-02 수정)
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
