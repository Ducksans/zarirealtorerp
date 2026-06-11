import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const candidates = await prisma.atsCandidate.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(candidates);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const candidate = await prisma.atsCandidate.create({
      data: {
        name: body.name,
        position: body.position,
        phone: body.phone,
        aiScore: Math.floor(Math.random() * 30) + 70, // Mock AI score 70-99
        appliedAt: new Date().toISOString().split('T')[0],
      }
    });

    await logAudit('CREATE', 'ATS_CANDIDATE', candidate.id, null, candidate);
    return NextResponse.json({ success: true, candidate });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
