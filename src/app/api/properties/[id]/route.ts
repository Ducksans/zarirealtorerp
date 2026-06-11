/*---
id: route.ts
milestone: M4
why: 매물 단건 API (상세 조회 / 부분 수정·인증 처리 / 소프트 삭제)
backlinks: [[[API_Routes]]]
---*/

/**
 * @file src/app/api/properties/[id]/route.ts
 * @description 매물 단건 API — GET(상세), PATCH(부분 수정 + 상태 변경 + 인증 처리), DELETE(HIDDEN 소프트 삭제)
 * @dependencies prisma, errorHandler, zod
 * @purpose 인증 처리({ verify: 'owner' | 'field' })와 상태 변경 모두 AuditLog 기록
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError, AppError } from '@/lib/errorHandler';

const PROPERTY_TYPES = ['아파트', '오피스텔', '빌라', '상가', '사무실', '토지', '기타'] as const;
const DEAL_TYPES = ['매매', '전세', '월세'] as const;
const STATUSES = ['ACTIVE', 'CONTRACTED', 'HIDDEN'] as const;

const PatchPropertySchema = z.object({
  // 인증 처리 액션
  verify: z.enum(['owner', 'field']).optional(),
  // 부분 수정 필드
  address: z.string().min(1, '주소는 비울 수 없습니다.').optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  dealType: z.enum(DEAL_TYPES).optional(),
  price: z.coerce.number().int().positive('가격은 양수여야 합니다.').optional(),
  monthlyRent: z.coerce.number().int().positive('월세는 양수여야 합니다.').nullable().optional(),
  areaM2: z.coerce.number().positive('면적은 양수여야 합니다.').nullable().optional(),
  description: z.string().nullable().optional(),
  imageUrls: z.array(z.string().min(1)).max(5).optional(),
  ownerName: z.string().nullable().optional(),
  status: z.enum(STATUSES).optional(),
  // 변경 사유 (AuditLog)
  reason: z.string().optional(),
});

const AGENT_INCLUDE = {
  agent: { select: { name: true, role: true, employeeId: true } },
} as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = await prisma.property.findUnique({
      where: { id },
      include: AGENT_INCLUDE,
    });
    if (!property) {
      throw new AppError('해당 매물을 찾을 수 없습니다.', 404);
    }
    return NextResponse.json(property);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = PatchPropertySchema.parse(body);

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('해당 매물을 찾을 수 없습니다.', 404);
    }

    // 1) 인증 처리 액션: { verify: 'owner' } 또는 { verify: 'field' }
    if (validated.verify) {
      const verifyData =
        validated.verify === 'owner'
          ? { ownerVerified: true }
          : { fieldVerifiedAt: new Date() };

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.property.update({
          where: { id },
          data: verifyData,
          include: AGENT_INCLUDE,
        });
        await tx.auditLog.create({
          data: {
            action: 'UPDATE',
            entity: 'PROPERTY',
            entityId: id,
            actorId: 'SYSTEM',
            beforeData: JSON.stringify(existing),
            afterData: JSON.stringify(result),
            reason: validated.reason?.trim() || '인증 처리',
          },
        });
        return result;
      });
      return NextResponse.json(updated);
    }

    // 2) 부분 수정 + 상태 변경
    const data: Record<string, unknown> = {};
    if (validated.address !== undefined) data.address = validated.address;
    if (validated.propertyType !== undefined) data.propertyType = validated.propertyType;
    if (validated.dealType !== undefined) data.dealType = validated.dealType;
    if (validated.price !== undefined) data.price = validated.price;
    if (validated.monthlyRent !== undefined) data.monthlyRent = validated.monthlyRent;
    if (validated.areaM2 !== undefined) data.areaM2 = validated.areaM2;
    if (validated.description !== undefined) data.description = validated.description;
    if (validated.ownerName !== undefined) data.ownerName = validated.ownerName;
    if (validated.status !== undefined) data.status = validated.status;
    if (validated.imageUrls !== undefined) {
      data.imageUrls =
        validated.imageUrls.length > 0 ? JSON.stringify(validated.imageUrls) : null;
    }

    if (Object.keys(data).length === 0) {
      throw new AppError('수정할 내용이 없습니다.', 400);
    }

    // 월세가 아닌 거래 유형으로 변경 시 월세 금액 제거
    const nextDealType = (data.dealType as string | undefined) ?? existing.dealType;
    if (nextDealType !== '월세') {
      data.monthlyRent = null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.property.update({
        where: { id },
        data,
        include: AGENT_INCLUDE,
      });
      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'PROPERTY',
          entityId: id,
          actorId: 'SYSTEM',
          beforeData: JSON.stringify(existing),
          afterData: JSON.stringify(result),
          reason:
            validated.reason?.trim() ||
            (validated.status !== undefined ? '매물 상태 변경' : '매물 정보 수정'),
        },
      });
      return result;
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason =
      typeof body?.reason === 'string' && body.reason.trim()
        ? body.reason.trim()
        : '매물 숨김 처리 (소프트 삭제)';

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('해당 매물을 찾을 수 없습니다.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.property.update({
        where: { id },
        data: { status: 'HIDDEN' },
      });
      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'PROPERTY',
          entityId: id,
          actorId: 'SYSTEM',
          beforeData: JSON.stringify(existing),
          afterData: JSON.stringify(result),
          reason,
        },
      });
      return result;
    });

    return NextResponse.json({ success: true, property: updated });
  } catch (error) {
    return handleError(error);
  }
}
