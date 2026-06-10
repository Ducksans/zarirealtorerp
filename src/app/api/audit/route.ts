import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/errorHandler';
import { z } from 'zod';

const AuditQuerySchema = z.object({
  entity: z.string().min(1, 'entity is required'),
  entityId: z.string().min(1, 'entityId is required'),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = {
      entity: url.searchParams.get('entity') || '',
      entityId: url.searchParams.get('entityId') || '',
    };
    const validated = AuditQuerySchema.parse(query);

    const logs = await prisma.auditLog.findMany({
      where: {
        entity: validated.entity,
        entityId: validated.entityId
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(logs);
  } catch (error) {
    return handleError(error);
  }
}
