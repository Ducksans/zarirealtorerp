/*---
id: api/appointments/route.ts
milestone: M11
why: 일정 관리 API — 기간/담당자/상태 필터 목록 + 신규 일정 등록 (AuditLog 기록)
backlinks: [[[API_Routes]], [[schedule/page.tsx]], [[customers/[id]/page.tsx]]]
---*/

/**
 * @file src/app/api/appointments/route.ts
 * @description 일정(Appointment) 컬렉션 엔드포인트 — GET(scheduledAt 범위 조회), POST(등록)
 * @dependencies prisma, zod, errorHandler
 * @purpose 주간 캘린더 뷰와 고객 상세 타임라인이 공유하는 일정 데이터 소스.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/errorHandler';

const APPOINTMENT_TYPES = ['임장', '계약', '상담', '기타'] as const;

const AppointmentCreateSchema = z.object({
  title: z.string().min(1, '일정 제목은 필수입니다.'),
  type: z.enum(APPOINTMENT_TYPES, '유형은 임장/계약/상담/기타 중 하나여야 합니다.'),
  scheduledAt: z
    .string()
    .min(1, '일시는 필수입니다.')
    .refine((v) => !Number.isNaN(Date.parse(v)), '유효한 일시 형식이 아닙니다.'),
  agentId: z.string().min(1, '담당자는 필수입니다.'),
  customerId: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
  memo: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get('from') || '';
    const to = url.searchParams.get('to') || '';
    const agentId = url.searchParams.get('agentId') || '';
    const status = url.searchParams.get('status') || '';

    const where: any = {};
    if (from || to) {
      where.scheduledAt = {};
      if (from && !Number.isNaN(Date.parse(from))) where.scheduledAt.gte = new Date(from);
      if (to && !Number.isNaN(Date.parse(to))) where.scheduledAt.lte = new Date(to);
    }
    if (agentId) where.agentId = agentId;
    if (status) where.status = status;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        property: { select: { id: true, address: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({ appointments, total: appointments.length });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = AppointmentCreateSchema.parse(body);

    const appointment = await prisma.appointment.create({
      data: {
        title: validated.title,
        type: validated.type,
        scheduledAt: new Date(validated.scheduledAt),
        agentId: validated.agentId,
        customerId: validated.customerId || null,
        propertyId: validated.propertyId || null,
        memo: validated.memo || null,
      },
      include: {
        agent: { select: { name: true } },
        customer: { select: { name: true } },
        property: { select: { address: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'APPOINTMENT',
        entityId: appointment.id,
        actorId: 'SYSTEM',
        afterData: JSON.stringify(appointment),
        reason: '일정 신규 등록',
      },
    });

    return NextResponse.json(appointment, { status: 201 });
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
