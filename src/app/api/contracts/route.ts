/*---
id: route.ts
milestone: M0
why: API 라우트 엔드포인트 (route.ts)
backlinks: [[[API_Routes]]]
---*/

/**
 * @file src/app/api/contracts/route.ts
 * @description 계약(매출) 관리 API 엔드포인트 (Controller)
 * @dependencies contractService, errorHandler, zod
 * @purpose HTTP 요청 파싱, Zod 검증, 응답 포맷팅 전담
 * @audit-fixes CRITICAL-05(Zod 검증)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getContracts, createContract, deleteContract } from '@/services/contractService';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/errorHandler';

const CreateContractSchema = z.object({
  agentId: z.string().min(1, '담당 사원 ID는 필수입니다'),
  grossCommission: z.coerce.number().positive('매출액은 양수여야 합니다'),
  contractDate: z.string().optional(),
  // 계약 원장(관리자) 확장 필드 — 기존 사용처(/contracts)는 미전송 시 그대로 동작
  propertyAddress: z.string().optional(),
  clientName: z.string().optional(),
  contractType: z.string().optional()
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    // 확장 파라미터 (계약 원장/문서 보관소용): month=YYYY-MM, withDocs=1
    const month = url.searchParams.get('month') || '';
    const withDocs = url.searchParams.get('withDocs') === '1';

    // 확장 경로: 월 필터 또는 문서 포함 요청 시 (응답 형태는 동일 — 하위호환 유지)
    if (month || withDocs) {
      const where: { contractDate?: { gte: Date; lt: Date } } = {};
      if (/^\d{4}-\d{2}$/.test(month)) {
        const [y, m] = month.split('-').map(Number);
        where.contractDate = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
      }

      const [contracts, total] = await Promise.all([
        prisma.contract.findMany({
          where,
          include: {
            agent: { select: { name: true, role: true, employeeId: true } },
            documents: { orderBy: { uploadedAt: 'desc' } }
          },
          orderBy: { contractDate: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.contract.count({ where })
      ]);

      return NextResponse.json({
        contracts,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    }

    const { contracts, total } = await getContracts(search, page, limit);

    return NextResponse.json({
      contracts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = CreateContractSchema.parse(body);

    const hasDetails =
      validated.propertyAddress !== undefined ||
      validated.clientName !== undefined ||
      validated.contractType !== undefined;

    if (hasDetails) {
      // 계약 원장 확장 등록: 거래 상세 포함 (100원 단위 절사 + AuditLog — 기존 서비스 로직과 동일 규칙)
      const gross = Math.floor(Number(validated.grossCommission) / 100) * 100;
      const contract = await prisma.$transaction(async (tx) => {
        const created = await tx.contract.create({
          data: {
            agentId: validated.agentId,
            grossCommission: gross,
            contractDate: validated.contractDate ? new Date(validated.contractDate) : new Date(),
            propertyAddress: validated.propertyAddress || null,
            clientName: validated.clientName || null,
            contractType: validated.contractType || null
          }
        });
        await tx.auditLog.create({
          data: {
            action: 'CREATE',
            entity: 'CONTRACT',
            entityId: created.id,
            actorId: 'SYSTEM',
            afterData: JSON.stringify(created),
            reason: '신규 계약 등록 (계약 원장)'
          }
        });
        return created;
      });
      return NextResponse.json(contract, { status: 201 });
    }

    const contract = await createContract(
      validated.agentId,
      validated.grossCommission,
      validated.contractDate
    );
    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map(e => e.message).join(', ') },
        { status: 400 }
      );
    }
    return handleError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    await deleteContract(id as string);
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
}
