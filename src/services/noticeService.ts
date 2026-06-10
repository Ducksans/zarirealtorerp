/*---
id: noticeService.ts
milestone: M0
why: 기본 구조 파일 (noticeService.ts)
backlinks: []
---*/

/**
 * @file src/services/noticeService.ts
 * @description 공지사항 게시판 데이터베이스 통신 및 비즈니스 로직
 * @dependencies prisma (싱글턴), AppError
 * @purpose Controller와 DB 로직 분리 (SRP)
 * @audit-fixes CRITICAL-02(싱글턴)
 */

import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errorHandler';

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

  const notice = await prisma.notice.create({
    data: {
      title,
      content,
      authorId: authorId || 'ADMIN'
    }
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

  await prisma.notice.delete({ where: { id } });
  return true;
}
