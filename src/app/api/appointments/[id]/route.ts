/*---
id: api/appointments/[id]/route.ts
milestone: M11
why: 일정 단건 API — 상태 변경(DONE/CANCELED)·내용 수정 PATCH, 하드 삭제 DELETE + AuditLog
backlinks: [[[API_Routes]], [[schedule/page.tsx]], [[customers/[id]/page.tsx]]]
---*/

/**
 * @file src/app/api/appointments/[id]/route.ts
 * @description 일정(Appointment) 단건 GET / PATCH / DELETE(하드)
 * @dependencies prisma, zod, errorHandler
 * @purpose 주간 캘린더·고객 타임라인에서 일정 완료/취소 처리와 수정·삭제를 담당.
 *          일정은 이력 가치가 낮아 하드 삭제하되, AuditLog에 beforeData를 남긴다.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError, AppError } from '@/lib/errorHandler';

const APPOINTMENT_TYPES = ['임장', '계약', '상담', '기타'] as const;

const AppointmentUpdateSchema = z.object({
  title: z.string().min(1, '일정 제목은 비울 수 없습니다.').optional(),
  type: z.enum(APPOINTMENT_TYPES, '유형은 임장/계약/상담/기타 중 하나여야 합니다.').optional(),
  scheduledAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), '유효한 일시 형식이 아닙니다.')
    .optional(),
  status: z.enum(['SCHEDULED', 'DONE', 'CANCELED'], '상태는 SCHEDULED/DONE/CANCELED 중 하나여야 합니다.').optional(),
  agentId: z.string().min(1).optional(),
  customerId: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
  memo: z.string().optional().nullable(),
});

const APPOINTMENT_INCLUDE = {
  agent: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true } },
  property: { select: { id: true, address: true } },
} as const;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: APPOINTMENT_INCLUDE,
    });
    if (!appointment) throw new AppError('일정을 찾을 수 없습니다.', 404);
    return NextResponse.json(appointment);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = AppointmentUpdateSchema.parse(body);

    const before = await prisma.appointment.findUnique({ where: { id } });
    if (!before) throw new AppError('일정을 찾을 수 없습니다.', 404);

    const { scheduledAt, ...rest } = validated;
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...rest,
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
      },
      include: APPOINTMENT_INCLUDE,
    });

    // 상태 변경(완료/취소)과 일반 수정을 사유에서 구분
    const reason =
      body.reason ||
      (validated.status && validated.status !== before.status
        ? `일정 상태 변경: ${before.status} → ${validated.status}`
        : '일정 정보 수정');

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'APPOINTMENT',
        entityId: id,
        actorId: 'SYSTEM',
        beforeData: JSON.stringify(before),
        afterData: JSON.stringify(updated),
        reason,
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

    const before = await prisma.appointment.findUnique({ where: { id } });
    if (!before) throw new AppError('일정을 찾을 수 없습니다.', 404);

    // 하드 삭제: 일정은 원장 데이터가 아니므로 실삭제하되 AuditLog에 원본 보존
    await prisma.appointment.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'APPOINTMENT',
        entityId: id,
        actorId: 'SYSTEM',
        beforeData: JSON.stringify(before),
        reason: '일정 삭제 (하드)',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
