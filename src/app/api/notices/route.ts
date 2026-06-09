/**
 * @file src/app/api/notices/route.ts
 * @description 공지사항 관리 API 엔드포인트 (Controller)
 * @dependencies noticeService, errorHandler
 * @purpose HTTP 요청 파싱 및 응답 포맷팅만 담당 (비즈니스 로직 배제)
 */

import { NextResponse } from 'next/server';
import { getNotices, createNotice, deleteNotice } from '@/services/noticeService';
import { handleError } from '@/lib/errorHandler';

export async function GET() {
  try {
    const notices = await getNotices();
    return NextResponse.json(notices);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, authorId } = body;
    
    const notice = await createNotice(title, content, authorId);
    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    await deleteNotice(id as string);
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
}
