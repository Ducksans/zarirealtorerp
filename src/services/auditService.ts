/*---
id: auditService.ts
milestone: M0
why: 기본 구조 파일 (auditService.ts)
backlinks: []
---*/

/**
 * @file src/services/auditService.ts
 * @description 엔티티의 CUD 작업 발생 시 이력을 추적하는 범용 서비스
 * @dependencies prisma
 * @purpose 데이터의 변경 과정(Before/After)과 사유를 영구 보존하여 기업 감사(Audit)에 대비함
 */

import { prisma } from '@/lib/prisma';

export async function createAuditLog({
  action,
  entity,
  entityId,
  actorId,
  beforeData,
  afterData,
  reason
}: {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'USER' | 'CONTRACT' | 'SETTLEMENT';
  entityId: string;
  actorId: string;
  beforeData?: any;
  afterData?: any;
  reason?: string;
}) {
  return await prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      actorId: actorId || 'SYSTEM',
      beforeData: beforeData ? JSON.stringify(beforeData) : null,
      afterData: afterData ? JSON.stringify(afterData) : null,
      reason: reason || null
    }
  });
}
