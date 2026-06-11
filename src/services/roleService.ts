import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errorHandler';
import { logAudit } from '@/lib/audit';

export async function getRoles() {
  return await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  });
}

export async function getPermissions() {
  return await prisma.permission.findMany();
}

export async function updateRolePermissions(roleId: string, permissionIds: string[], userId: string = 'SYSTEM') {
  const existingRole = await prisma.role.findUnique({ where: { id: roleId }, include: { permissions: true } });
  if (!existingRole) throw new AppError('Role not found', 404);

  return await prisma.$transaction(async (tx) => {
    // Delete existing permissions for this role
    await tx.rolePermission.deleteMany({
      where: { roleId }
    });

    // Create new permissions
    if (permissionIds.length > 0) {
      await tx.rolePermission.createMany({
        data: permissionIds.map(pid => ({ roleId, permissionId: pid }))
      });
    }

    const updatedRole = await tx.role.findUnique({
      where: { id: roleId },
      include: { permissions: true }
    });

    await tx.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'ROLE_PERMISSIONS',
        entityId: roleId,
        actorId: userId,
        beforeData: JSON.stringify(existingRole.permissions),
        afterData: JSON.stringify(permissionIds),
        reason: '권한 수정'
      }
    });

    return updatedRole;
  });
}
