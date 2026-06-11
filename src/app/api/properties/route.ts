/*---
id: route.ts
milestone: M4
why: 매물 원장 API 엔드포인트 (목록 조회 / 신규 등록)
backlinks: [[[API_Routes]]]
---*/

/**
 * @file src/app/api/properties/route.ts
 * @description 매물 원장 API — GET(검색/필터/페이지네이션 목록), POST(신규 등록 + AuditLog)
 * @dependencies prisma, errorHandler, zod
 * @purpose HTTP 요청 파싱, Zod 검증, 트랜잭션 생성, 응답 포맷팅 전담
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/errorHandler';

const PROPERTY_TYPES = ['아파트', '오피스텔', '빌라', '상가', '사무실', '토지', '기타'] as const;
const DEAL_TYPES = ['매매', '전세', '월세'] as const;
const STATUSES = ['ACTIVE', 'CONTRACTED', 'HIDDEN'] as const;

const CreatePropertySchema = z
  .object({
    address: z.string().min(1, '주소는 필수입니다.'),
    propertyType: z.enum(PROPERTY_TYPES, { message: '매물 유형이 올바르지 않습니다.' }),
    dealType: z.enum(DEAL_TYPES, { message: '거래 유형이 올바르지 않습니다.' }),
    price: z.coerce.number().int('가격은 정수(원)여야 합니다.').positive('가격은 양수여야 합니다.'),
    monthlyRent: z.coerce.number().int('월세는 정수(원)여야 합니다.').positive('월세는 양수여야 합니다.').optional(),
    areaM2: z.coerce.number().positive('면적은 양수여야 합니다.').optional(),
    description: z.string().optional(),
    imageUrls: z.array(z.string().min(1)).max(5, '이미지 URL은 최대 5개까지 등록할 수 있습니다.').optional(),
    ownerName: z.string().optional(),
    agentId: z.string().min(1, '담당자 ID는 필수입니다.'),
    customerId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.dealType === '월세' && !data.monthlyRent) {
      ctx.addIssue({
        code: 'custom',
        path: ['monthlyRent'],
        message: '월세 거래는 월세 금액이 필수입니다.',
      });
    }
  });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const dealType = url.searchParams.get('dealType') || '';
    const status = url.searchParams.get('status') || '';
    const agentId = url.searchParams.get('agentId') || '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1') || 1);
    const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '50') || 50);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { address: { contains: search } },
        { ownerName: { contains: search } },
      ];
    }
    if (dealType && (DEAL_TYPES as readonly string[]).includes(dealType)) {
      where.dealType = dealType;
    }
    if (status && (STATUSES as readonly string[]).includes(status)) {
      where.status = status;
    }
    if (agentId) {
      where.agentId = agentId;
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          agent: { select: { name: true, role: true, employeeId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({
      properties,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = CreatePropertySchema.parse(body);

    const property = await prisma.$transaction(async (tx) => {
      const created = await tx.property.create({
        data: {
          address: validated.address,
          propertyType: validated.propertyType,
          dealType: validated.dealType,
          price: validated.price,
          monthlyRent: validated.dealType === '월세' ? validated.monthlyRent : null,
          areaM2: validated.areaM2 ?? null,
          description: validated.description || null,
          imageUrls: validated.imageUrls && validated.imageUrls.length > 0
            ? JSON.stringify(validated.imageUrls)
            : null,
          ownerName: validated.ownerName || null,
          agentId: validated.agentId,
          customerId: validated.customerId || null,
        },
        include: {
          agent: { select: { name: true, role: true, employeeId: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'PROPERTY',
          entityId: created.id,
          actorId: 'SYSTEM',
          afterData: JSON.stringify(created),
          reason: '매물 등록',
        },
      });

      return created;
    });

    return NextResponse.json(property, { status: 201 });
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
