/**
 * @file src/services/noticeService.ts
 * @description 공지사항 게시판 데이터베이스 통신 및 비즈니스 로직
 * @dependencies prisma (싱글턴), AppError
 * @purpose Controller와 DB 로직 분리 (SRP)
 * @audit-fixes CRITICAL-02(싱글턴)
 */

import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errorHandler';
import { logAudit } from '@/lib/audit';

export async function getNotices() {
  const notices = await prisma.notice.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return notices;
}

export async function createNotice(title: string, content: string, authorId: string) {
  if (!title || !content) {
    throw new AppError('제목과 내용은 필수 항목입니다.', 400);
  }

  const notice = await prisma.$transaction(async (tx) => {
    const newNotice = await tx.notice.create({
      data: {
        title,
        content,
        authorId: authorId || 'ADMIN'
      }
    });
    
    await tx.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'NOTICE',
        entityId: newNotice.id,
        actorId: authorId || 'ADMIN',
        afterData: JSON.stringify(newNotice),
        reason: '공지사항 작성'
      }
    });
    
    return newNotice;
  });

  return notice;
}

export async function deleteNotice(id: string) {
  if (!id) {
    throw new AppError('삭제할 공지사항 ID가 필요합니다.', 400);
  }

  const existing = await prisma.notice.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('공지사항을 찾을 수 없습니다.', 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.notice.delete({ where: { id } });
    
    await tx.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'NOTICE',
        entityId: id,
        actorId: 'SYSTEM',
        beforeData: JSON.stringify(existing),
        reason: '공지사항 삭제'
      }
    });
  });
  
  return true;
}
