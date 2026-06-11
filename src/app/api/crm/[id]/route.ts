import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { stage } = body;

    const lead = await prisma.$transaction(async (tx) => {
      const existing = await tx.crmLead.findUnique({ where: { id: params.id } });
      const updated = await tx.crmLead.update({
        where: { id: params.id },
        data: { stage }
      });
      
      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'CRM_LEAD',
          entityId: updated.id,
          actorId: session.user.id,
          beforeData: JSON.stringify(existing),
          afterData: JSON.stringify(updated),
          reason: `CRM 리드 스테이지 변경: ${stage}`
        }
      });
      
      return updated;
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.crmLead.findUnique({ where: { id: params.id } });
      if (existing) {
        await tx.crmLead.delete({ where: { id: params.id } });
        await tx.auditLog.create({
          data: {
            action: 'DELETE',
            entity: 'CRM_LEAD',
            entityId: params.id,
            actorId: session.user.id,
            beforeData: JSON.stringify(existing),
            reason: 'CRM 리드 삭제'
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
