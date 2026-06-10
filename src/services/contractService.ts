/*---
id: contractService.ts
milestone: M0
why: 기본 구조 파일 (contractService.ts)
backlinks: []
---*/

/**
 * @file src/services/contractService.ts
 * @description 계약(매출) 관련 데이터베이스 통신 및 비즈니스 로직
 * @dependencies prisma (싱글턴), AppError
 * @purpose Controller와 DB 로직 분리 (SRP), 100원 단위 절사
 * @audit-fixes CRITICAL-02(싱글턴)
 */

import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errorHandler';
import { createAuditLog } from './auditService';

export async function getContracts(search: string, page: number, limit: number) {
  const where = search ? {
    agent: {
      OR: [
        { name: { contains: search } },
        { employeeId: { contains: search } }
      ]
    }
  } : {};

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      agent: { select: { name: true, role: true, employeeId: true } }
    },
    orderBy: { contractDate: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.contract.count({ where });

  return { contracts, total };
}

export async function createContract(agentId: string, grossCommission: number, contractDate?: string) {
  if (!agentId || grossCommission === undefined) {
    throw new AppError('담당 사원 ID와 매출액은 필수 항목입니다.', 400);
  }

  const gross = Math.floor(Number(grossCommission) / 100) * 100;

  return await prisma.$transaction(async (tx) => {
    const contract = await tx.contract.create({
      data: {
        agentId,
        grossCommission: gross,
        contractDate: contractDate ? new Date(contractDate) : new Date()
      }
    });

    await tx.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'CONTRACT',
        entityId: contract.id,
        actorId: 'SYSTEM', // 향후 인증 세션의 userId로 교체
        afterData: JSON.stringify(contract),
        reason: '신규 계약 등록'
      }
    });

    return contract;
  });
}

/**
 * 계약(건별 매출)의 상태(전자결재, 지급) 업데이트
 */
export async function updateContractStatus(
  contractId: string,
  data: { signatureStatus?: string; paymentStatus?: string },
  actorId: string,
  reason: string
) {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.contract.findUnique({ where: { id: contractId } });
    if (!existing) throw new AppError('계약을 찾을 수 없습니다.', 404);

    const updateData: any = {};
    if (data.signatureStatus) {
      updateData.signatureStatus = data.signatureStatus;
      if (data.signatureStatus === 'SIGNED') updateData.signatureDate = new Date();
    }
    if (data.paymentStatus) {
      updateData.paymentStatus = data.paymentStatus;
      if (data.paymentStatus === 'PAID') updateData.paymentDate = new Date();
    }

    const updated = await tx.contract.update({
      where: { id: contractId },
      data: updateData
    });

    await tx.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'CONTRACT',
        entityId: contractId,
        actorId,
        beforeData: JSON.stringify(existing),
        afterData: JSON.stringify(updated),
        reason
      }
    });

    return updated;
  });
}

export async function deleteContract(id: string, actorId: string = 'SYSTEM', reason: string = '계약 삭제') {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.contract.findUnique({ where: { id } });
    if (!existing) throw new AppError('계약을 찾을 수 없습니다.', 404);

    await tx.contract.delete({ where: { id } });

    await tx.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'CONTRACT',
        entityId: id,
        actorId,
        beforeData: JSON.stringify(existing),
        reason
      }
    });

    return true;
  });
}
