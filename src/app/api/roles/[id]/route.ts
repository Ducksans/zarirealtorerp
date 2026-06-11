import { NextResponse } from 'next/server';
import { updateRolePermissions } from '@/services/roleService';
import { handleError } from '@/lib/errorHandler';
import { getSession } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id } = await params;
    const { permissionIds } = await req.json();
    
    if (!Array.isArray(permissionIds)) {
      return NextResponse.json({ error: 'permissionIds must be an array' }, { status: 400 });
    }

    const updated = await updateRolePermissions(id, permissionIds, session.user?.id);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}
