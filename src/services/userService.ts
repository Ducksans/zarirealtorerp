/*---
id: userService.ts
milestone: M0
why: 기본 구조 파일 (userService.ts)
backlinks: []
---*/

/**
 * @file src/services/userService.ts
 * @description 사용자(직원) 관리 서비스 - 확장된 개인정보, 이력 추적, Soft Delete 포함
 */

import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errorHandler';
import { createAuditLog } from './auditService';
import { encrypt, decrypt } from '@/lib/crypto';

export async function getUsers(search: string, role: string, status: string, page: number, limit: number) {
  const whereCondition: any = { AND: [] };

  if (search) {
    whereCondition.AND.push({
      OR: [
        { name: { contains: search } },
        { employeeId: { contains: search } }
      ]
    });
  }
  if (role) {
    whereCondition.AND.push({ role });
  }
  
  whereCondition.AND.push({ status: status || 'ACTIVE' });

  const where = whereCondition.AND.length > 0 ? whereCondition : {};

  const users = await prisma.user.findMany({
    where,
    include: {
      upline: { select: { name: true, employeeId: true } }
    },
    orderBy: { joinedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const totalCount = await prisma.user.count({ where });

  return { users, totalCount };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      upline: { select: { name: true, employeeId: true, role: true } },
      downlines: { select: { id: true, name: true, employeeId: true, role: true } },
      roleHistory: { orderBy: { promotedAt: 'asc' } },
      documents: { orderBy: { uploadedAt: 'desc' } }
    }
  });

  if (!user) throw new AppError('사용자를 찾을 수 없습니다.', 404);

  if (user.ssnSuffix) {
    user.ssnSuffix = decrypt(user.ssnSuffix);
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: { entity: 'USER', entityId: id },
    orderBy: { createdAt: 'desc' }
  });

  return { ...user, auditLogs };
}

export async function createUser(data: {
  name: string; role: string; uplineId: string | null;
  birthDate?: string; ssnSuffix?: string; phone?: string;
  address?: string; bankAccount?: string; joinedAt?: Date;
  documents?: { type: string, fileUrl: string }[];
}, actorId: string = 'SYSTEM', reason: string = '신규 입사자 등록') {
  
  if (!data.name || !data.role) {
    throw new AppError('이름과 직급은 필수 항목입니다.', 400);
  }

  // 트랜잭션: 유저생성 + 히스토리생성 + AuditLog 생성
  return await prisma.$transaction(async (tx) => {
    // 사번 순차 발급
    const lastUser = await tx.user.findFirst({
      where: { employeeId: { startsWith: 'EMP-' } },
      orderBy: { employeeId: 'desc' },
      select: { employeeId: true }
    });
    const lastSeq = lastUser
      ? parseInt(lastUser.employeeId.split('-').pop() || '0', 10)
      : 0;
    const employeeId = `EMP-${new Date().getFullYear()}-${String(lastSeq + 1).padStart(4, '0')}`;

    const user = await tx.user.create({
      data: {
        name: data.name,
        role: data.role,
        employeeId,
        uplineId: data.uplineId || null,
        birthDate: data.birthDate,
        ssnSuffix: data.ssnSuffix ? encrypt(data.ssnSuffix) : null,
        phone: data.phone,
        address: data.address,
        bankAccount: data.bankAccount,
        joinedAt: data.joinedAt
      }
    });

    // 직급 이력 추가
    await tx.userRoleHistory.create({
      data: {
        userId: user.id,
        role: user.role
      }
    });

    // 문서 추가
    if (data.documents && data.documents.length > 0) {
      await tx.userDocument.createMany({
        data: data.documents.map(doc => ({
          userId: user.id,
          type: doc.type,
          fileUrl: doc.fileUrl
        }))
      });
    }

    // Audit Log 남기기
    await tx.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'USER',
        entityId: user.id,
        actorId,
        afterData: JSON.stringify(user),
        reason
      }
    });

    return user;
  });
}

export async function updateUser(id: string, data: any, actorId: string, reason: string) {
  if (!id) throw new AppError('수정할 사용자 ID가 필요합니다.', 400);
  if (!reason) throw new AppError('정보 수정 시 변경 사유 입력은 필수입니다.', 400);

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { id } });
    if (!existing) throw new AppError('사용자를 찾을 수 없습니다.', 404);

    const updated = await tx.user.update({
      where: { id },
      data: {
        ...data,
        ssnSuffix: data.ssnSuffix ? encrypt(data.ssnSuffix) : undefined
      }
    });

    // 직급이 변경되었다면 이력 추가
    if (data.role && data.role !== existing.role) {
      await tx.userRoleHistory.create({
        data: {
          userId: id,
          role: data.role
        }
      });
    }

    // Audit Log 추가
    await tx.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'USER',
        entityId: id,
        actorId,
        beforeData: JSON.stringify(existing),
        afterData: JSON.stringify(updated),
        reason
      }
    });

    return updated;
  });
}

export async function deleteUser(id: string, actorId: string, reason: string) {
  if (!id) throw new AppError('삭제할 사용자 ID가 필요합니다.', 400);
  if (!reason) throw new AppError('삭제(퇴사) 사유 입력은 필수입니다.', 400);

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { id } });
    if (!existing) throw new AppError('사용자를 찾을 수 없습니다.', 404);

    // Soft Delete: 상태를 RESIGNED로 변경
    const updated = await tx.user.update({
      where: { id },
      data: {
        status: 'RESIGNED',
        resignedAt: new Date()
      }
    });

    await tx.auditLog.create({
      data: {
        action: 'DELETE', // 실제 DB 삭제는 아니지만 비즈니스상 DELETE(퇴사)
        entity: 'USER',
        entityId: id,
        actorId,
        beforeData: JSON.stringify(existing),
        afterData: JSON.stringify(updated),
        reason
      }
    });

    return true;
  });
}
