import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { handleError } from '@/lib/errorHandler';

const CustomerUpdateSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  customerType: z.string().optional(),
  agentId: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const customer = await prisma.customerLedger.findUnique({
      where: { id },
      include: { agent: { select: { name: true } } }
    });
    if (!customer) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const validated = CustomerUpdateSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const beforeData = await tx.customerLedger.findUnique({ where: { id } });
      if (!beforeData) throw new Error('Customer not found');

      const customer = await tx.customerLedger.update({
        where: { id },
        data: validated
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'CUSTOMER',
          entityId: customer.id,
          actorId: 'SYSTEM', // Replace with session user ID in a real app
          beforeData: JSON.stringify(beforeData),
          afterData: JSON.stringify(customer),
          reason: '고객 정보 수정'
        }
      });

      return customer;
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await prisma.$transaction(async (tx) => {
      const beforeData = await tx.customerLedger.findUnique({ where: { id } });
      if (!beforeData) throw new Error('Customer not found');

      await tx.customerLedger.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'CUSTOMER',
          entityId: id,
          actorId: 'SYSTEM', // Replace with session user ID in a real app
          beforeData: JSON.stringify(beforeData),
          reason: '고객 정보 삭제'
        }
      });
    });

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
}
