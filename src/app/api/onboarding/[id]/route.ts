/*---
id: api/onboarding/[id]/route.ts
milestone: M3
why: 채용 ATS 파이프라인 — 단계 이동/순차 결재(PATCH), 최종승인 후 사원 전환(POST)
backlinks: [[[API_Routes]], [[OnboardingRequest]], [[userService]]]
---*/

/**
 * @file src/app/api/onboarding/[id]/route.ts
 * @description ATS 지원자 단건 전이 API
 * - PATCH /api/onboarding/[id] : { atsStage? } 칸반 단계 이동(인접 단계만) 또는
 *                                { approve: { as, memo, decision } } 순차 결재 (TL→DH→BM→CEO)
 * - POST  /api/onboarding/[id] : { action: 'convert' } APPROVED 지원자를 정식 사원(User)으로 전환
 * 모든 전이는 AuditLog(entity: 'ONBOARDING')에 기록한다.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError, AppError } from '@/lib/errorHandler';
import { decrypt } from '@/lib/crypto';
import { createUser } from '@/services/userService';

const ATS_STAGES = ['NEW', 'RECRUITER', 'PRACTICAL', 'MANAGER', 'FINAL', 'ONBOARDING'] as const;
const APPROVAL_ORDER = ['PENDING_TL', 'PENDING_DH', 'PENDING_BM', 'PENDING_CEO', 'APPROVED'] as const;

// 결재자 역할 → 현재 처리 가능한 status 매핑
const APPROVER_MAP = {
  TL: { expects: 'PENDING_TL', label: '팀장' },
  DH: { expects: 'PENDING_DH', label: '본부장' },
  BM: { expects: 'PENDING_BM', label: '지점장' },
  CEO: { expects: 'PENDING_CEO', label: '대표' },
} as const;

const PatchSchema = z
  .object({
    atsStage: z.enum(ATS_STAGES).optional(),
    approve: z
      .object({
        as: z.enum(['TL', 'DH', 'BM', 'CEO']),
        memo: z.string().optional(),
        decision: z.enum(['APPROVE', 'REJECT']),
      })
      .optional(),
  })
  .refine((v) => Boolean(v.atsStage) !== Boolean(v.approve), {
    message: 'atsStage(단계 이동) 또는 approve(결재) 중 정확히 하나를 보내야 합니다.',
  });

const ConvertSchema = z.object({
  action: z.literal('convert'),
  actorId: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = PatchSchema.parse(await req.json());

    const existing = await prisma.onboardingRequest.findUnique({ where: { id } });
    if (!existing) throw new AppError('지원자를 찾을 수 없습니다.', 404);

    // ─────────────── 1) ATS 칸반 단계 이동 ───────────────
    if (body.atsStage) {
      if (existing.status === 'REJECTED') {
        throw new AppError('반려(REJECTED)된 지원자는 단계를 이동할 수 없습니다.', 400);
      }
      const fromIdx = ATS_STAGES.indexOf(existing.atsStage as (typeof ATS_STAGES)[number]);
      const toIdx = ATS_STAGES.indexOf(body.atsStage);
      if (toIdx === fromIdx) {
        throw new AppError('이미 해당 단계에 있습니다.', 400);
      }
      if (body.atsStage === 'ONBOARDING') {
        throw new AppError('ONBOARDING 단계는 최종 승인 후 [사원 전환]을 통해서만 진입합니다.', 400);
      }
      if (existing.atsStage === 'ONBOARDING') {
        throw new AppError('이미 사원 전환이 완료된 지원자입니다.', 400);
      }
      if (Math.abs(toIdx - fromIdx) !== 1) {
        throw new AppError('ATS 단계는 한 번에 한 칸씩만 이동할 수 있습니다.', 400);
      }

      const updated = await prisma.$transaction(async (tx) => {
        const next = await tx.onboardingRequest.update({
          where: { id },
          data: { atsStage: body.atsStage },
        });
        await tx.auditLog.create({
          data: {
            action: 'UPDATE',
            entity: 'ONBOARDING',
            entityId: id,
            actorId: 'SYSTEM',
            beforeData: JSON.stringify({ atsStage: existing.atsStage }),
            afterData: JSON.stringify({ atsStage: next.atsStage }),
            reason: 'ATS 단계 이동',
          },
        });
        return next;
      });

      return NextResponse.json({ id: updated.id, atsStage: updated.atsStage, status: updated.status });
    }

    // ─────────────── 2) 순차 결재 (TL → DH → BM → CEO) ───────────────
    const approve = body.approve!;
    const approver = APPROVER_MAP[approve.as];

    if (existing.status === 'REJECTED') {
      throw new AppError('이미 반려(REJECTED) 처리된 지원자입니다.', 400);
    }
    if (existing.status === 'APPROVED') {
      throw new AppError('이미 최종 승인(APPROVED)된 지원자입니다.', 400);
    }
    if (existing.status !== approver.expects) {
      throw new AppError(
        `결재 순서 위반: 현재 ${existing.status} 단계이므로 ${approver.label}(${approve.as}) 결재를 처리할 수 없습니다.`,
        400
      );
    }
    if (approve.decision === 'REJECT' && !approve.memo?.trim()) {
      throw new AppError('반려 시 사유(메모) 입력은 필수입니다.', 400);
    }

    const nextStatus =
      approve.decision === 'REJECT'
        ? 'REJECTED'
        : APPROVAL_ORDER[APPROVAL_ORDER.indexOf(approver.expects) + 1];

    const memoValue = approve.memo?.trim() || null;
    const memoPatch =
      approve.as === 'TL'
        ? { tlMemo: memoValue }
        : approve.as === 'DH'
          ? { dhMemo: memoValue }
          : approve.as === 'BM'
            ? { bmMemo: memoValue }
            : { ceoMemo: memoValue };

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.onboardingRequest.update({
        where: { id },
        data: { status: nextStatus, ...memoPatch },
      });
      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'ONBOARDING',
          entityId: id,
          actorId: approve.as,
          beforeData: JSON.stringify({ status: existing.status }),
          afterData: JSON.stringify({ status: next.status, memo: approve.memo?.trim() || null }),
          reason:
            approve.decision === 'APPROVE'
              ? `${approver.label} 결재 승인`
              : `${approver.label} 결재 반려: ${approve.memo?.trim()}`,
        },
      });
      return next;
    });

    return NextResponse.json({ id: updated.id, atsStage: updated.atsStage, status: updated.status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(', ') }, { status: 400 });
    }
    return handleError(error);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = ConvertSchema.parse(await req.json());

    const existing = await prisma.onboardingRequest.findUnique({ where: { id } });
    if (!existing) throw new AppError('지원자를 찾을 수 없습니다.', 404);

    if (existing.status !== 'APPROVED') {
      throw new AppError('최종 승인(APPROVED) 상태의 지원자만 사원으로 전환할 수 있습니다.', 400);
    }
    if (existing.atsStage === 'ONBOARDING') {
      throw new AppError('이미 사원 전환이 완료된 지원자입니다.', 400);
    }

    // 지원 서류 메타([{type, url}]) → User 문서 형식({type, fileUrl})으로 변환
    let documents: { type: string; fileUrl: string }[] = [];
    try {
      const parsed = JSON.parse(existing.documents || '[]') as { type?: string; url?: string }[];
      documents = parsed
        .filter((d) => d && d.type && d.url)
        .map((d) => ({ type: d.type as string, fileUrl: d.url as string }));
    } catch {
      documents = [];
    }

    // userService.createUser 재사용: 사번 순차 발급 + 직급 이력 + AuditLog(USER) 포함
    const user = await createUser(
      {
        name: existing.name,
        role: 'REGULAR',
        uplineId: null,
        birthDate: existing.birthDate,
        ssnSuffix: existing.ssnSuffix ? decrypt(existing.ssnSuffix) : undefined,
        phone: existing.phone,
        address: existing.address,
        bankAccount: existing.bankAccount,
        joinedAt: new Date(),
        documents,
      },
      body.actorId || 'SYSTEM',
      'ATS 최종 승인에 따른 사원 전환'
    );

    // 전환 완료 표시 + ONBOARDING 전이 기록
    await prisma.$transaction(async (tx) => {
      await tx.onboardingRequest.update({
        where: { id },
        data: { atsStage: 'ONBOARDING' },
      });
      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'ONBOARDING',
          entityId: id,
          actorId: body.actorId || 'SYSTEM',
          beforeData: JSON.stringify({ atsStage: existing.atsStage, status: existing.status }),
          afterData: JSON.stringify({ atsStage: 'ONBOARDING', status: 'APPROVED', userId: user.id, employeeId: user.employeeId }),
          reason: '사원 전환 완료 (User 생성)',
        },
      });
    });

    return NextResponse.json(
      { id, converted: true, userId: user.id, employeeId: user.employeeId, name: user.name },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(', ') }, { status: 400 });
    }
    return handleError(error);
  }
}
