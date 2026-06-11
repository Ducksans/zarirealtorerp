/*---
id: api/customers/[id]/route.ts
milestone: M5
why: 고객 단건 API — 상세 조회(매물·최근 일정 include), 수정, 소프트 삭제(ARCHIVED) + AuditLog
backlinks: [[[API_Routes]], [[customers/[id]/page.tsx]]]
---*/

/**
 * @file src/app/api/customers/[id]/route.ts
 * @description 고객 단건 GET / PATCH / DELETE(소프트) — 상세에서만 연락처 전체 노출
 * @dependencies prisma, zod, errorHandler
 * @purpose 변이는 모두 AuditLog(before/after)에 기록하고, 삭제는 status=ARCHIVED 소프트 처리.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError, AppError } from '@/lib/errorHandler';

const CUSTOMER_TYPES = ['임대인', '임차인', '매수인', '매도인', '기타'] as const;

const CustomerUpdateSchema = z.object({
  name: z.string().min(1, '고객 이름은 비울 수 없습니다.').optional(),
  type: z.enum(CUSTOMER_TYPES, '유형은 임대인/임차인/매수인/매도인/기타 중 하나여야 합니다.').optional(),
  agentId: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  memo: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true } },
        properties: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            address: true,
            propertyType: true,
            dealType: true,
            price: true,
            monthlyRent: true,
            status: true,
          },
        },
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          take: 10,
          include: { property: { select: { address: true } } },
        },
      },
    });

    if (!customer) throw new AppError('고객을 찾을 수 없습니다.', 404);

    // 상세 화면에서만 전화번호 전체 노출 (목록은 마스킹)
    return NextResponse.json(customer);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = CustomerUpdateSchema.parse(body);

    const before = await prisma.customer.findUnique({ where: { id } });
    if (!before) throw new AppError('고객을 찾을 수 없습니다.', 404);

    const updated = await prisma.customer.update({
      where: { id },
      data: validated,
      include: { agent: { select: { name: true } } },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'CUSTOMER',
        entityId: id,
        actorId: 'SYSTEM',
        beforeData: JSON.stringify(before),
        afterData: JSON.stringify(updated),
        reason: body.reason || '고객 정보 수정',
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }
    return handleError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const before = await prisma.customer.findUnique({ where: { id } });
    if (!before) throw new AppError('고객을 찾을 수 없습니다.', 404);

    // 소프트 삭제: 이력 보존을 위해 status만 ARCHIVED 처리
    const archived = await prisma.customer.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'CUSTOMER',
        entityId: id,
        actorId: 'SYSTEM',
        beforeData: JSON.stringify(before),
        afterData: JSON.stringify(archived),
        reason: '고객 보관 처리 (소프트 삭제)',
      },
    });

    return NextResponse.json({ success: true, status: 'ARCHIVED' });
  } catch (error) {
    return handleError(error);
  }
}
