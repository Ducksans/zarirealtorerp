/*---
id: api/onboarding/route.ts
milestone: M3
why: 채용 ATS 파이프라인 — 입사지원 접수(POST) 및 지원자 목록 조회(GET) API
backlinks: [[[API_Routes]], [[OnboardingRequest]]]
---*/

/**
 * @file src/app/api/onboarding/route.ts
 * @description 입사지원서 접수 및 ATS 파이프라인 지원자 목록 조회
 * - GET  /api/onboarding?stage=&status=  : 지원자 목록 (최신순, ssnSuffix 미노출)
 * - POST /api/onboarding                 : 신규 입사지원 (atsStage=NEW, status=PENDING_TL)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/errorHandler';
import { encrypt } from '@/lib/crypto';

const DocumentSchema = z.object({
  type: z.string().min(1, '서류 종류를 선택해 주세요.'),
  url: z.string().min(1, '서류 URL을 입력해 주세요.'),
});

const ApplySchema = z.object({
  name: z.string().min(2, '이름은 최소 2글자 이상이어야 합니다.'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '생년월일은 YYYY-MM-DD 형식으로 입력해 주세요.'),
  phone: z.string().min(9, '연락처를 정확히 입력해 주세요.'),
  address: z.string().min(2, '주소를 입력해 주세요.'),
  bankAccount: z.string().min(2, '급여 수령 계좌를 입력해 주세요.'),
  ssnSuffix: z.string().regex(/^\d{7}$/, '주민번호 뒷자리는 7자리 숫자입니다.').optional().or(z.literal('')),
  documents: z.array(DocumentSchema).max(3, '서류는 최대 3건까지 첨부할 수 있습니다.').optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const stage = url.searchParams.get('stage') || '';
    const status = url.searchParams.get('status') || '';

    const where: { atsStage?: string; status?: string } = {};
    if (stage) where.atsStage = stage;
    if (status) where.status = status;

    const requests = await prisma.onboardingRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        birthDate: true,
        phone: true,
        address: true,
        bankAccount: true,
        documents: true,
        aiAnalysis: true,
        atsStage: true,
        status: true,
        tlMemo: true,
        dhMemo: true,
        bmMemo: true,
        ceoMemo: true,
        createdAt: true,
        updatedAt: true,
        // ssnSuffix는 개인정보 보호를 위해 목록 응답에서 제외 (암호화 보관)
      },
    });

    return NextResponse.json({ requests, total: requests.length });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = ApplySchema.parse(body);

    const created = await prisma.$transaction(async (tx) => {
      const request = await tx.onboardingRequest.create({
        data: {
          name: validated.name,
          birthDate: validated.birthDate,
          ssnSuffix: validated.ssnSuffix ? encrypt(validated.ssnSuffix) : null,
          phone: validated.phone,
          address: validated.address,
          bankAccount: validated.bankAccount,
          documents: JSON.stringify(validated.documents ?? []),
          atsStage: 'NEW',
          status: 'PENDING_TL',
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'ONBOARDING',
          entityId: request.id,
          actorId: 'SYSTEM',
          afterData: JSON.stringify({ ...request, ssnSuffix: undefined }),
          reason: '입사지원서 접수',
        },
      });

      return request;
    });

    return NextResponse.json(
      { id: created.id, name: created.name, atsStage: created.atsStage, status: created.status, createdAt: created.createdAt },
      { status: 201 }
    );
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
