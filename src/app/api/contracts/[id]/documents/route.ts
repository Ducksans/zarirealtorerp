/*---
id: route.ts
milestone: M16
why: 계약별 문서 보관함 API (목록/등록/삭제 + AuditLog)
backlinks: [[[API_Routes]]]
---*/

/**
 * @file src/app/api/contracts/[id]/documents/route.ts
 * @description 계약별 첨부 문서(ContractDocument) 관리 API
 * @dependencies prisma, errorHandler, zod
 * @purpose GET(계약 요약 + 문서 목록), POST(문서 등록), DELETE(docId 쿼리 + 사유 → AuditLog)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AppError, handleError } from '@/lib/errorHandler';

const DOC_TYPES = [
  '계약서',
  '중개대상물확인설명서',
  '등기부등본',
  '건축물대장',
  '영수증',
  '비밀유지서약서',
  '기타',
] as const;

const CreateDocumentSchema = z.object({
  type: z.enum(DOC_TYPES),
  fileName: z.string().min(1, '파일명은 필수입니다.'),
  fileUrl: z.string().min(1, '파일 URL/경로는 필수입니다.'),
});

/** GET: 계약 요약 + 문서 목록 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        agent: { select: { name: true, role: true, employeeId: true } },
        documents: { orderBy: { uploadedAt: 'desc' } },
      },
    });
    if (!contract) throw new AppError('계약을 찾을 수 없습니다.', 404);

    const { documents, ...rest } = contract;
    return NextResponse.json({ contract: rest, documents });
  } catch (error) {
    return handleError(error);
  }
}

/** POST: 문서 등록 (type/fileName/fileUrl) + AuditLog(CREATE) */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = CreateDocumentSchema.parse(body);

    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new AppError('계약을 찾을 수 없습니다.', 404);

    const document = await prisma.$transaction(async (tx) => {
      const created = await tx.contractDocument.create({
        data: {
          contractId: id,
          type: validated.type,
          fileName: validated.fileName,
          fileUrl: validated.fileUrl,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'CONTRACT_DOCUMENT',
          entityId: created.id,
          actorId: 'SYSTEM', // 향후 인증 세션의 userId로 교체
          afterData: JSON.stringify(created),
          reason: `계약(${id}) 문서 등록: ${validated.type}`,
        },
      });

      return created;
    });

    return NextResponse.json(document, { status: 201 });
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

/** DELETE: ?docId= 쿼리 + body.reason → AuditLog(DELETE) */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const docId = url.searchParams.get('docId');
    if (!docId) throw new AppError('삭제할 문서 ID(docId)가 필요합니다.', 400);

    const body = await req.json().catch(() => ({}));
    const reason: string =
      typeof body?.reason === 'string' && body.reason.trim()
        ? body.reason.trim()
        : '관리자 문서 삭제';

    const existing = await prisma.contractDocument.findUnique({
      where: { id: docId },
    });
    if (!existing || existing.contractId !== id) {
      throw new AppError('해당 계약의 문서를 찾을 수 없습니다.', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.contractDocument.delete({ where: { id: docId } });

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'CONTRACT_DOCUMENT',
          entityId: docId,
          actorId: 'SYSTEM',
          beforeData: JSON.stringify(existing),
          reason,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
