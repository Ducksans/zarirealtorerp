import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const property = await prisma.propertyLedger.findUnique({
      where: { id: params.id },
      include: {
        agent: { select: { name: true, employeeId: true } },
        owner: { select: { name: true, phone: true } },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { title, propertyType, address, price, status, notes, ownerId, actorId } = body;

    const existingProperty = await prisma.propertyLedger.findUnique({
      where: { id: params.id },
    });

    if (!existingProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const updatedProperty = await prisma.$transaction(async (tx) => {
      const property = await tx.propertyLedger.update({
        where: { id: params.id },
        data: {
          title: title ?? existingProperty.title,
          propertyType: propertyType ?? existingProperty.propertyType,
          address: address ?? existingProperty.address,
          price: price ?? existingProperty.price,
          status: status ?? existingProperty.status,
          notes: notes ?? existingProperty.notes,
          ownerId: ownerId ?? existingProperty.ownerId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'PROPERTY',
          entityId: property.id,
          actorId: actorId || existingProperty.agentId, // fallback to agentId
          beforeData: JSON.stringify(existingProperty),
          afterData: JSON.stringify(property),
          reason: 'Property Ledger Updated',
        },
      });

      return property;
    });

    return NextResponse.json(updatedProperty);
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const actorId = searchParams.get('actorId');

    const existingProperty = await prisma.propertyLedger.findUnique({
      where: { id: params.id },
    });

    if (!existingProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.propertyLedger.delete({
        where: { id: params.id },
      });

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'PROPERTY',
          entityId: existingProperty.id,
          actorId: actorId || existingProperty.agentId,
          beforeData: JSON.stringify(existingProperty),
          reason: 'Property Ledger Deleted',
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
}
