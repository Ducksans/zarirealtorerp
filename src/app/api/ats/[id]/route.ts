import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const prisma = new PrismaClient();

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const oldCandidate = await prisma.atsCandidate.findUnique({ where: { id: params.id } });
    
    if (!oldCandidate) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await prisma.atsCandidate.update({
      where: { id: params.id },
      data: { stage: body.stage }
    });

    await logAudit('UPDATE', 'ATS_CANDIDATE', params.id, oldCandidate, updated);
    return NextResponse.json({ success: true, candidate: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
