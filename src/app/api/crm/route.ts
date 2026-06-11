import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const leads = await prisma.crmLead.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        agent: {
          select: { name: true }
        }
      }
    });
    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { customerName, contactInfo, propertyType, budget, notes } = body;

    const lead = await prisma.crmLead.create({
      data: {
        agentId: session.user.id,
        customerName,
        contactInfo,
        propertyType,
        budget: parseInt(budget) || null,
        stage: '신규접수',
        notes
      }
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
