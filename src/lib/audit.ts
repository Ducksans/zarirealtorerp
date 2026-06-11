import { PrismaClient } from '@prisma/client';
import { getSession } from './auth';

const prisma = new PrismaClient();

export async function logAudit(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: string,
  entityId: string,
  beforeData?: any,
  afterData?: any,
  reason?: string
) {
  try {
    const session = await getSession();
    const actorId = session?.user?.id || 'SYSTEM';

    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        actorId,
        beforeData: beforeData ? JSON.stringify(beforeData) : null,
        afterData: afterData ? JSON.stringify(afterData) : null,
        reason,
      },
    });
  } catch (error) {
    console.error('AuditLog error:', error);
    // Don't throw, we don't want audit logging failure to break the main transaction
  }
}
