import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const properties = await prisma.propertyLedger.findMany({
      where: status ? { status } : undefined,
      include: {
        agent: { select: { name: true, employeeId: true } },
        owner: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, propertyType, address, price, status, notes, agentId, ownerId } = body;

    // Validate required
    if (!title || !propertyType || !address || !price || !agentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newProperty = await prisma.$transaction(async (tx) => {
      const property = await tx.propertyLedger.create({
        data: {
          title,
          propertyType,
          address,
          price,
          status: status || 'AVAILABLE',
          notes,
          agentId,
          ownerId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'PROPERTY',
          entityId: property.id,
          actorId: agentId, // assuming the agent is the actor for now
          afterData: JSON.stringify(property),
          reason: 'Property Ledger Created',
        },
      });

      return property;
    });

    return NextResponse.json(newProperty, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}
