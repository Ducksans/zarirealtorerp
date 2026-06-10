/*---
id: route.ts
milestone: M0
why: API 라우트 엔드포인트 (route.ts)
backlinks: [[[API_Routes]]]
---*/

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/errorHandler';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const entity = url.searchParams.get('entity');
    const entityId = url.searchParams.get('entityId');

    if (!entity || !entityId) {
      return NextResponse.json({ error: 'entity와 entityId가 필요합니다.' }, { status: 400 });
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        entity,
        entityId
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(logs);
  } catch (error) {
    return handleError(error);
  }
}
