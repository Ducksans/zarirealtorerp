/*---
id: api/customers/route.ts
milestone: M5
why: 고객 원장 API — 목록 조회(검색/유형/담당자 필터, 연락처 마스킹) + 신규 등록 (AuditLog 기록)
backlinks: [[[API_Routes]], [[customers/page.tsx]]]
---*/

/**
 * @file src/app/api/customers/route.ts
 * @description 고객(Customer) 컬렉션 엔드포인트 — GET(목록+요약), POST(등록)
 * @dependencies prisma, zod, errorHandler
 * @purpose 목록 응답에서는 개인정보 보호를 위해 전화번호 가운데 자리를 마스킹하고,
 *          모든 변이는 AuditLog에 기록한다.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/errorHandler';

const CUSTOMER_TYPES = ['임대인', '임차인', '매수인', '매도인', '기타'] as const;

const CustomerCreateSchema = z.object({
  name: z.string().min(1, '고객 이름은 필수입니다.'),
  type: z.enum(CUSTOMER_TYPES, '유형은 임대인/임차인/매수인/매도인/기타 중 하나여야 합니다.'),
  agentId: z.string().min(1, '담당자는 필수입니다.'),
  phone: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  memo: z.string().optional().nullable(),
});

/** 목록 응답용 연락처 마스킹: 010-1234-5678 → 010-****-5678 */
function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return '***';
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const type = url.searchParams.get('type') || '';
    const agentId = url.searchParams.get('agentId') || '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10) || 20));

    const where: any = { status: 'ACTIVE' };
    if (search) {
      where.OR = [{ name: { contains: search } }, { phone: { contains: search } }];
    }
    if (type) where.type = type;
    if (agentId) where.agentId = agentId;

    // 이번 주(월요일 시작) 신규 고객 집계 기준
    const now = new Date();
    const weekStart = new Date(now);
    const day = weekStart.getDay(); // 0=일 ... 6=토
    weekStart.setDate(weekStart.getDate() - ((day + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    const [customers, total, activeCount, newThisWeek] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          agent: { select: { name: true } },
          _count: { select: { properties: true, appointments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customer.count({ where }),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.customer.count({ where: { status: 'ACTIVE', createdAt: { gte: weekStart } } }),
    ]);

    return NextResponse.json({
      customers: customers.map((c) => ({ ...c, phone: maskPhone(c.phone) })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      summary: { active: activeCount, newThisWeek },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = CustomerCreateSchema.parse(body);

    const customer = await prisma.customer.create({
      data: {
        name: validated.name,
        type: validated.type,
        agentId: validated.agentId,
        phone: validated.phone || null,
        source: validated.source || null,
        memo: validated.memo || null,
      },
      include: { agent: { select: { name: true } } },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'CUSTOMER',
        entityId: customer.id,
        actorId: 'SYSTEM',
        afterData: JSON.stringify(customer),
        reason: '고객 신규 등록',
      },
    });

    return NextResponse.json(customer, { status: 201 });
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
