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
import { handleError } from '@/lib/errorHandler';

const CreateContractSchema = z.object({
  agentId: z.string().min(1, '담당 사원 ID는 필수입니다'),
  grossCommission: z.coerce.number().positive('매출액은 양수여야 합니다'),
  contractDate: z.string().optional()
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

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

    const contract = await createContract(
      validated.agentId,
      validated.grossCommission,
      validated.contractDate
    );
    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors.map(e => e.message).join(', ') },
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
